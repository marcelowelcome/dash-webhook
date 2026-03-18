import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AC_API_URL = Deno.env.get('AC_API_URL') || ''
const AC_API_KEY = Deno.env.get('AC_API_KEY') || ''

// Palavras-chave que indicam deals a serem removidos
const EXCLUSION_KEYWORDS = [
  'teste', 'test',
  'fake', 'falso',
  'inválido', 'invalido', 'invalid',
  'duplicado', 'duplicate', 'repetido',
]

// IDs dos campos de motivo de perda no AC
const MOTIVO_PERDA_FIELD_ID = '2'
const MOTIVO_DESQUALIFICACAO_FIELD_ID = '303'

interface ACDealResponse {
  deal?: {
    id: string
    title: string
  }
}

interface DealFields {
  dealCustomFieldData?: Array<{
    customFieldId: string
    fieldValue: string
  }>
}

// Fetches deal WITH custom fields in a single API call (avoids N+1)
async function fetchDealWithFieldsFromAC(dealId: number): Promise<{ deal: ACDealResponse['deal'] | null; fields: Record<string, string> }> {
  if (!AC_API_URL || !AC_API_KEY) return { deal: null, fields: {} }

  try {
    const response = await fetch(
      `${AC_API_URL}/api/3/deals/${dealId}?include=dealCustomFieldData`,
      { headers: { 'Api-Token': AC_API_KEY } },
    )

    if (response.status === 404) {
      return { deal: null, fields: {} } // Deal não existe mais
    }

    if (!response.ok) {
      console.error(`AC API error for deal ${dealId}:`, response.status)
      return { deal: undefined, fields: {} }
    }

    const data = await response.json()
    const fields: Record<string, string> = {}
    for (const field of data.dealCustomFieldData || []) {
      const fId = String(field.customFieldId || field.custom_field_id || '')
      const fVal = String(field.fieldValue || field.custom_field_text_value || '')
      if (fId) fields[fId] = fVal
    }

    return { deal: data.deal, fields }
  } catch (error) {
    console.error(`Error fetching deal ${dealId} from AC:`, error)
    return { deal: undefined, fields: {} }
  }
}

function shouldExcludeDeal(title: string, fields: Record<string, string>): { exclude: boolean; reason: string } {
  const titleLower = title.toLowerCase()

  // Verificar título
  if (titleLower.includes('teste') || titleLower.includes('test')) {
    return { exclude: true, reason: 'título contém teste' }
  }

  // Verificar motivo de perda (field 2)
  const motivoPerda = (fields[MOTIVO_PERDA_FIELD_ID] || '').toLowerCase()
  for (const keyword of EXCLUSION_KEYWORDS) {
    if (motivoPerda.includes(keyword)) {
      return { exclude: true, reason: `motivo_perda contém "${keyword}"` }
    }
  }

  // Verificar motivo desqualificação (field 303)
  const motivoDesqualificacao = (fields[MOTIVO_DESQUALIFICACAO_FIELD_ID] || '').toLowerCase()
  for (const keyword of EXCLUSION_KEYWORDS) {
    if (motivoDesqualificacao.includes(keyword)) {
      return { exclude: true, reason: `motivo_desqualificacao contém "${keyword}"` }
    }
  }

  return { exclude: false, reason: '' }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Processa um deal e retorna a ação tomada
async function processDeal(
  supabase: ReturnType<typeof createClient>,
  dealId: number
): Promise<{ action: 'deleted' | 'kept' | 'error'; reason?: string }> {
  try {
    // Single API call fetches deal + custom fields (avoids N+1)
    const { deal: acDeal, fields } = await fetchDealWithFieldsFromAC(dealId)

    // Deal não existe mais no AC → deletar
    if (acDeal === null) {
      const { error } = await supabase.from('deals').delete().eq('id', dealId)
      if (!error) {
        return { action: 'deleted', reason: 'não existe no AC' }
      }
      return { action: 'error', reason: 'falha ao deletar' }
    }

    // Erro ao buscar, pular
    if (!acDeal) {
      return { action: 'kept', reason: 'erro na API AC' }
    }

    const { exclude, reason } = shouldExcludeDeal(acDeal.title, fields)

    if (exclude) {
      const { error } = await supabase.from('deals').delete().eq('id', dealId)
      if (!error) {
        return { action: 'deleted', reason }
      }
      return { action: 'error', reason: 'falha ao deletar' }
    }

    return { action: 'kept' }
  } catch (err) {
    console.error(`Error processing deal ${dealId}:`, err)
    return { action: 'error', reason: String(err) }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Parâmetros de paginação (permite processar em múltiplas chamadas)
  const url = new URL(req.url)
  const BATCH_SIZE = Math.min(parseInt(url.searchParams.get('limit') || '20'), 30)
  const cursor = parseInt(url.searchParams.get('cursor') || '0')
  const CONCURRENCY = 5 // Processar 5 deals em paralelo

  console.log(`=== DEALS CLEANUP batch cursor=${cursor} limit=${BATCH_SIZE} ===`)

  if (!AC_API_URL || !AC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AC credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar deals a partir do cursor
    const { data: deals, error } = await supabase
      .from('deals')
      .select('id')
      .gt('id', cursor)
      .order('id', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deals', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = {
      processed: 0,
      deleted: 0,
      kept: 0,
      errors: 0,
      deletedDeals: [] as Array<{ id: number; reason: string }>,
    }

    if (!deals || deals.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          done: true,
          nextCursor: null,
          results,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Processar em chunks paralelos
    for (let i = 0; i < deals.length; i += CONCURRENCY) {
      const chunk = deals.slice(i, i + CONCURRENCY)

      const chunkResults = await Promise.all(
        chunk.map(deal => processDeal(supabase, deal.id as number))
      )

      for (let j = 0; j < chunk.length; j++) {
        const dealId = chunk[j].id as number
        const result = chunkResults[j]
        results.processed++

        if (result.action === 'deleted') {
          results.deleted++
          results.deletedDeals.push({ id: dealId, reason: result.reason || '' })
          console.log(`DELETE: Deal ${dealId} - ${result.reason}`)
        } else if (result.action === 'kept') {
          results.kept++
        } else {
          results.errors++
        }
      }

      // Pequeno delay entre chunks para não sobrecarregar a API
      if (i + CONCURRENCY < deals.length) {
        await sleep(50)
      }
    }

    const lastDealId = deals[deals.length - 1].id as number
    const hasMore = deals.length === BATCH_SIZE

    console.log(`Batch complete: ${results.processed} processed, ${results.deleted} deleted, hasMore=${hasMore}`)

    return new Response(
      JSON.stringify({
        success: true,
        done: !hasMore,
        nextCursor: hasMore ? lastDealId : null,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: 'Cleanup failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
