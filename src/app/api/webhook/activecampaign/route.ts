import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CONV_MAP,
  ORC_MAP,
  DESTINO_NORM,
  parseBoolean,
} from '@/lib/ac-field-map'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// AC webhook payload schema
const WebhookPayloadSchema = z.object({
  type: z.string(),
  date_time: z.string().optional(),
  initiated_by: z.string().optional(),
  deal: z.object({
    id: z.string(),
    title: z.string().optional(),
    pipeline: z.string().optional(),
    stage: z.string().optional(),
    status: z.string().optional(),
    cdate: z.string().optional(), // created date
    mdate: z.string().optional(), // modified date
    fields: z.array(z.object({
      id: z.string().optional(),
      key: z.string().optional(),
      value: z.string().nullable(),
    })).optional(),
  }).optional(),
})

// Map AC field KEY (name) to DB column.
// Field IDs in AC webhook payloads are instance-specific (change per deal),
// so we match by the stable field key/name instead.
const FIELD_KEY_MAP: Record<string, string> = {
  // WW fields
  'Data e horário do agendamento da 1ª reunião': 'data_reuniao_1',
  'Como foi feita a 1ª reunião?': 'como_reuniao_1',
  'Data e horário do agendamento com a Closer:': 'data_closer',
  'Data e horário do agendamento com a Closer': 'data_closer',
  'Motivos de qualificação SDR': 'motivos_qualificacao_sdr',
  '[WW] [Closer] Data-Hora Ganho': 'data_fechamento',
  ' [WW] [Closer] Data-Hora Ganho': 'data_fechamento', // leading space variant
  'Automático - WW - Data Qualificação SDR': 'data_qualificado',
  'Qualificado para SQL': 'qualificado_sql',
  'WW | Como foi feita Reunião Closer': 'reuniao_closer',
  // Trips fields
  'Data e horário do agendamento da 1a. Reunião SDR TRIPS': 'data_reuniao_trips',
  'Como foi feita a 1a. Reunião SDR TRIPS': 'como_reuniao_trips',
  'Pagou a taxa?': 'pagou_taxa',
  'Pagamento de Taxa?': 'pagou_taxa',
}

// Additional deal fields mapped by key name
const DEAL_FIELD_MAP: Record<string, string> = {
  'Nome do Noivo(a)2': 'nome_noivo',
  'Número de convidados:': 'num_convidados',
  'Orçamento:': 'orcamento',
  'Destino': 'destino',
  'Motivo de perda': 'motivo_perda',
  'Valor fechado em contrato:': 'valor_fechado_em_contrato',
  'WW | Fonte do lead': 'ww_fonte_do_lead',
  'Cidade:': 'cidade',
  'Tempo de relacionamento': 'status_do_relacionamento',
}

const PIPELINE_GROUP: Record<string, string> = {
  "SDR Weddings": "1",
  "Closer Weddings": "3",
  "Planejamento Weddings": "4",
  "Convidados": "5",
  "Consultoras TRIPS": "6",
  "SDR - Trips": "8",
  "Convidados - Marcella": "9",
  "Convidados - Michelly": "10",
  "Convidados - Mariana Rosales": "11",
  "Elopment Wedding": "12",
  "Presentes Weddings": "14",
  "WT - Weex Pass": "16",
  "WW - Internacional": "17",
  "WW - Gestão Casamento ": "18",
  "WW - Gestão Convidados": "19",
  "Extras Viagem": "20",
  "WW - Atendimento ao Convidado": "21",
  "Produção": "22",
  "Controle de Qualidade": "23",
  "Concierge (+50k)": "24",
  "Coordenação Pós Venda (-50k)": "25",
  "WT - Expedição NYC - FerStall": "30",
  "Outros Desqualificados | Wedding": "31",
  "WTN - Desqualificados": "34",
  "WelConnect": "37",
}

function parseDate(value: string | null): string | null {
  if (!value || value === '') return null
  try {
    // Handle DD/MM/YYYY HH:mm format (Brazilian)
    const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?/)
    if (match) {
      const [, day, month, year, hour = '00', minute = '00'] = match
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    // Try ISO format
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook received:', JSON.stringify(body, null, 2))

    const parsed = WebhookPayloadSchema.safeParse(body)
    if (!parsed.success) {
      console.error('Invalid payload:', parsed.error)
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { type, deal } = parsed.data

    // Handle deal delete
    if (type === 'deal_delete' || type === 'deal.delete') {
      if (!deal?.id) {
        return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 })
      }

      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', parseInt(deal.id))

      if (error) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'deleted', id: deal.id })
    }

    // Handle deal create/update
    if (type === 'deal_add' || type === 'deal_update' || type === 'deal.add' || type === 'deal.update') {
      if (!deal) {
        return NextResponse.json({ error: 'Missing deal data' }, { status: 400 })
      }

      // Build deal record
      const record: Record<string, unknown> = {
        id: parseInt(deal.id),
        title: deal.title || null,
        pipeline: deal.pipeline || null,
        stage: deal.stage || null,
        status: deal.status || null,
        created_at: deal.cdate ? parseDate(deal.cdate) : null,
        updated_at: deal.mdate ? parseDate(deal.mdate) : null,
      }

      // Compute is_elopement and group_id
      record.is_elopement = deal.pipeline === 'Elopment Wedding'
      if (deal.pipeline) {
        const gid = PIPELINE_GROUP[deal.pipeline]
        if (gid) record.group_id = gid
      }

      // Map custom fields by key name (field IDs are instance-specific, not stable)
      const fieldByKey: Record<string, string> = {}
      if (deal.fields) {
        for (const field of deal.fields) {
          const key = (field.key || '').trim()
          if (key && field.value) fieldByKey[key] = field.value.trim()

          // Map by key name to DB column
          const dbColumn = key ? FIELD_KEY_MAP[key] : undefined
          if (!dbColumn) continue

          switch (dbColumn) {
            case 'data_reuniao_1':
            case 'data_qualificado':
            case 'data_closer':
            case 'data_fechamento':
            case 'data_reuniao_trips':
              record[dbColumn] = parseDate(field.value)
              break
            case 'qualificado_sql':
            case 'pagou_taxa':
              record[dbColumn] = parseBoolean(field.value)
              break
            default:
              record[dbColumn] = field.value || null
          }

          // Also map DEAL_FIELD_MAP entries
          const dealCol = DEAL_FIELD_MAP[key]
          if (dealCol && field.value) {
            switch (dealCol) {
              case 'num_convidados': {
                // Try CONV_MAP first (text range), then parse as number
                const v = CONV_MAP[field.value.toLowerCase().trim()]
                if (v !== undefined) {
                  record.num_convidados = v
                } else {
                  const n = parseFloat(field.value.replace(/[^\d]/g, ''))
                  if (!isNaN(n)) record.num_convidados = n
                }
                break
              }
              case 'orcamento': {
                const v = ORC_MAP[field.value.toLowerCase().trim()]
                if (v !== undefined) {
                  record.orcamento = v
                } else {
                  const n = parseFloat(field.value.replace(/[^\d]/g, ''))
                  if (!isNaN(n)) record.orcamento = n
                }
                break
              }
              case 'valor_fechado_em_contrato': {
                const n = parseFloat(field.value.replace(/[^\d]/g, ''))
                if (!isNaN(n)) record.valor_fechado_em_contrato = n
                break
              }
              case 'destino': {
                if (field.value === 'Outro') {
                  record.destino = fieldByKey['Outro destino'] || fieldByKey['Outro'] || 'Outro'
                } else {
                  record.destino = DESTINO_NORM[field.value.toLowerCase().trim()] ?? field.value.trim()
                }
                break
              }
              default:
                record[dealCol] = field.value
            }
          }
        }
      }

      // Fallback: formulário do lead by key name (Onde quer casar, Quantas pessoas, Quanto investir)
      const rawDestino = fieldByKey['Onde você quer casar?*'] || fieldByKey['Onde você quer casar?']
      if (rawDestino && !record.destino) {
        if (rawDestino === 'Outro') {
          record.destino = fieldByKey['Outro destino:'] || fieldByKey['Se marcou "Outro", qual destino?'] || 'Outro'
        } else {
          record.destino = DESTINO_NORM[rawDestino.toLowerCase().trim()] ?? rawDestino
        }
      }

      const rawConv = fieldByKey['Quantas pessoas vão no seu casamento?'] || fieldByKey['Quantos convidados?']
      if (rawConv && !record.num_convidados) {
        const v = CONV_MAP[rawConv.toLowerCase().trim()]
        if (v !== undefined) record.num_convidados = v
      }

      const rawOrc = fieldByKey['Quanto você pensa em investir?*'] || fieldByKey['Quanto você pensa em investir?']
      if (rawOrc && !record.orcamento) {
        const v = ORC_MAP[rawOrc.toLowerCase().trim()]
        if (v !== undefined) record.orcamento = v
      }

      // Save raw payload for debugging
      record.raw_data = body

      // Upsert to database
      const { error } = await supabase
        .from('deals')
        .upsert(record, { onConflict: 'id' })

      if (error) {
        console.error('Upsert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: type.includes('add') ? 'created' : 'updated',
        id: deal.id
      })
    }

    return NextResponse.json({ success: true, action: 'ignored', type })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'activecampaign-webhook' })
}
