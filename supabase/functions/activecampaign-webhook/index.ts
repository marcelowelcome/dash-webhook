import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Full mapping of AC field IDs to DB columns
const FIELD_MAP: Record<string, string> = {
  "1": "forecasted_close_date",
  "2": "motivo_de_perda",
  "6": "data_reuniao_1",
  "7": "orcamento",
  "8": "num_convidados",
  "14": "nome_do_noivo_a_2",
  "15": "e_mail_do_noivo_a_2",
  "16": "cidade",
  "17": "como_reuniao_1",
  "18": "data_closer",
  "19": "tipo_da_reuni_o_com_a_closer",
  "20": "pagamento_de_taxa",
  "21": "qual_o_nome_do_a_seu_sua_noivo_a",
  "26": "quantas_pessoas_v_o_no_seu_casamento",
  "27": "quanto_voc_pensa_em_investir",
  "28": "onde_voc_quer_casar",
  "29": "se_outro_qual",
  "30": "dw_ou_elopment",
  "31": "grupo_de_whats_criado",
  "33": "cpf_contato_principal",
  "35": "cpf_noivo_a_2",
  "40": "pacote_contratado_no_hotel_e_forma_de_reserva_pagamento",
  "41": "operadora_de_bloqueio",
  "42": "hospedagem",
  "47": "ww_closer_motivo_de_perda",
  "51": "mensagem_do_convidado",
  "52": "consultora_casal",
  "53": "wt_destino",
  "55": "wt_tem_destino",
  "56": "sdr_wt_motivo_de_perda",
  "57": "sdr_wt_destino_informado_pelo_lead",
  "58": "sdr_wt_data_contato_futuro",
  "59": "vnd_wt_motivo_de_perda",
  "60": "vnd_wt_n_da_venda_no_monde",
  "61": "ww_link_do_proposeful",
  "62": "pacote_ww_n_de_convidados",
  "64": "valor_fechado_em_contrato",
  "65": "cerimonial_incluso_quantos",
  "68": "n_mero_da_venda_monde",
  "69": "telefone_noivo_a_2",
  "70": "prazo_para_devolu_o_do_contrato",
  "71": "enviado_pagamento_de_taxa",
  "72": "nome_do_casal",
  "73": "wt_mensagem_extra",
  "74": "sdr_wt_venda_monde_taxa",
  "76": "wt_com_quem",
  "77": "sdr_wt_resumo_do_neg_cio",
  "79": "link_prop_planejamento",
  "81": "vnd_wt_origem_do_lead",
  "82": "sdr_wt_a_o_influencer",
  "83": "motivos_qualificacao_sdr",
  "84": "origem_da_ltima_convers_o",
  "85": "wt_origem_da_ltima_convers_o",
  "86": "ww_convidado_venda_monde",
  "87": "data_fechamento",
  "91": "vnd_wt_qual_valor_da_venda",
  "92": "vnd_wt_qual_a_data_do_embarque",
  "96": "wt_fly_ski_quem_vai_embarcar_com_voc",
  "97": "wt_fly_ski_qual_seria_o_m_s_ideal_para_a_sua_viagem",
  "98": "data_qualificado",
  "99": "bww_convidado_ddi",
  "100": "bww_convidado_grupo_de_convite",
  "101": "bww_convidado_observa_o_do_convite",
  "102": "bww_convidado_tarifa_promocional",
  "103": "bww_convidado_genero",
  "104": "bww_convidado_tipo",
  "105": "codigo_do_casamento_deal",
  "106": "bww_convidados_situa_o",
  "107": "bww_convidados_mesa",
  "108": "apresenta_o_realizada",
  "109": "site_do_casamento",
  "110": "login",
  "111": "senha",
  "112": "data_preenchimento_lista_convidados",
  "113": "envio_do_save_the_date",
  "114": "inicio_atendimento_convidados",
  "117": "previs_o_data_de_casamento",
  "118": "previs_o_contratar_assessoria",
  "120": "j_tem_destino_definido",
  "121": "destino",
  "122": "autom_tico_or_amento_por_convidado",
  "123": "como_conheceu_a_ww",
  "124": "motivo_da_escolha_de_um_destination_wedding",
  "125": "j_foi_em_algum_destination_wedding",
  "126": "status_do_relacionamento",
  "127": "costumam_viajar",
  "128": "data_e_hor_rio_definidos_para_o_casamento",
  "129": "data_final_da_a_o",
  "130": "nome_do_casamento",
  "131": "local_do_casamento",
  "132": "data_confirmada_do_casamento",
  "133": "porcentagem_desconto_a_o_inicial",
  "134": "retomar_o_contato_em",
  "135": "lead_score_2",
  "136": "wt_planos",
  "140": "telefone",
  "141": "vnd_wt_data_retorno_da_viagem",
  "142": "data_final_da_a_o_novo",
  "143": "qual_a_cidade_do_lead_para_saber_o_aeroporto",
  "144": "como_conheceu_a_welcome_trips",
  "145": "qual_o_intuito_da_viagem_lazer_lua_de_mel_trabalho_fam_lia",
  "146": "a_viagem_tem_algum_motivo_especial",
  "147": "j_possui_algum_servi_o_contratado_para_a_viagem_transfer_a_reo",
  "148": "destino_s_do_roteiro",
  "149": "data_de_embarque",
  "150": "quantos_dias_de_viagem",
  "151": "quantas_pessoas",
  "152": "quantas_crian_as_idade",
  "153": "qual_o_or_amento_por_pessoa",
  "155": "data_e_hora_da_1a_reuni_o",
  "156": "os_dois_participaram_da_reuni_o",
  "157": "observa_es",
  "158": "tipo_de_hospedagem",
  "159": "quantas_reuni_es_foram_feitas",
  "160": "quantos_apartamentos_foram_bloqueados",
  "161": "dados_do_aplicativo",
  "163": "ww_convidados_2",
  "164": "ww_investimento_2",
  "166": "data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips",
  "167": "como_foi_feita_a_1a_reuni_o_sdr_trips",
  "168": "wt_enviado_pagamento_de_taxa",
  "169": "qualificado_para_sql",
  "177": "wtn_voc_j_esquiou_alguma_vez",
  "178": "wtn_investimento_maior_que_20_mil",
  "180": "wtn_e_qual_o_principal_motivo_da_sua_viagem",
  "181": "wtn_como_voc_avalia_o_seu_comportamento_de_consumo_em_rela_o_a_",
  "182": "wtn_qual_o_seu_n_vel_de_experi_ncia_com_esqui_snowboard",
  "183": "wtn_qual_tipo_de_ambiente_voc_prefere",
  "184": "wtn_quais_atividades_mais_gostaria_de_fazer_al_m_de_esquiar",
  "185": "wtn_voc_est_viajando_com_crian_as_se_sim_qual_a_faixa_et_ria",
  "186": "wtn_importante_que_o_resort_tenha_piscina",
  "187": "wtn_informa_es_adicionais_clubmed",
  "188": "wtn_voc_ter_acompanhantes_na_viagem",
  "189": "wtn_op_o_de_pacote",
  "190": "ww_link_do_asaas",
  "192": "vnd_wt_motivo_perda",
  "257": "wt_tem_hospedagem_contratada",
  "258": "wt_o_que_voce_esta_buscando",
  "259": "wt_tem_hospedagem_contratada",
  "261": "wtn_voc_ter_acompanhantes_na_viagem",
  "263": "wt_investimento_por_pessoa",
  "264": "wtn_o_que_voce_esta_buscando",
  "265": "noivo_a_1_nome_completo",
  "266": "motivo_de_escolher_a_welcome",
  "267": "quem_indicou_a_welcome_pra_voc_s",
  "268": "dw_escreva_com_suas_palavras_os_motivos_pelos_quais_escolheram_",
  "269": "destino_dos_sonhos",
  "270": "se_influencer_qual",
  "271": "follow_extra_eleg_vel",
  "272": "fluxo_de_mensagem",
  "273": "id_da_mensagem",
  "275": "quali_frequ_ncia_em_viagem",
  "276": "quali_destino",
  "277": "quali_compra_em_agencia",
  "278": "quali_investimento",
  "279": "ww_fonte_do_lead",
  "280": "wc_agendamento_de_reuni_o",
  "281": "wc_como_foi_feita_a_reuni_o",
  "282": "wc_motivo_de_perda",
  "283": "wc_qualifica_o",
  "284": "wc_data_e_hora_do_ganho",
  "293": "wc_disparo_follow_de_compra",
  "296": "ww_link_reuni_o_teams_sdr",
  "297": "ww_link_reuni_o_teams_closer",
  "298": "agendamento_degusta_o",
  "299": "reuniao_closer",
  "300": "wc_segmento",
  "301": "wc_instagram",
  "302": "pagou_a_taxa",
  "303": "motivo_desqualifica_o_sdr",
  "305": "flexibilidade_de_destino",
  "306": "motivo_da_oportunidade_futura",
  "307": "ww_fez_segunda_reuni_o",
  "308": "ww_foi_apresentado_detalhamento_de_or_amento"
}

// AC status codes to string
const STATUS_MAP: Record<string, string> = {
  '0': 'Open',
  '1': 'Won',
  '2': 'Lost',
}

function parseDate(value: string | null): string | null {
  if (!value || value === '') return null
  try {
    const match1 = String(value).match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
    if (match1) {
      const [, year, month, day, hour, minute, second] = match1
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    const match2 = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?/)
    if (match2) {
      const [, day, month, year, hour = '00', minute = '00'] = match2
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
    return null
  } catch {
    return null
  }
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false
  const lower = String(value).toLowerCase().trim()
  return lower === 'yes' || lower === 'sim' || lower === 'true' || lower === '1'
}

function parseNumber(value: string | null): number | null {
  if (!value || value === '') return null
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ''))
  return isNaN(num) ? null : num
}

function parseFormData(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    const keys = key.replace(/\]/g, '').split('[')
    let current: Record<string, unknown> = result

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current)) {
        const nextKey = keys[i + 1]
        current[k] = /^\d+$/.test(nextKey) ? [] : {}
      }
      current = current[k] as Record<string, unknown>
    }

    const lastKey = keys[keys.length - 1]
    current[lastKey] = value
  }

  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', endpoint: 'activecampaign-webhook' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, unknown>

    if (contentType.includes('application/json')) {
      body = await req.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      body = parseFormData(formData)
    } else {
      try {
        const text = await req.text()
        const params = new URLSearchParams(text)
        const formData = new FormData()
        for (const [key, value] of params.entries()) {
          formData.append(key, value)
        }
        body = parseFormData(formData)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Unsupported content type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('Webhook received:', JSON.stringify(body, null, 2))

    const type = body.type as string
    const deal = body.deal as Record<string, unknown> | undefined

    // Handle deal delete
    if (type === 'deal_delete' || type === 'deal.delete') {
      if (!deal?.id) {
        return new Response(
          JSON.stringify({ error: 'Missing deal ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', parseInt(String(deal.id)))

      if (error) {
        console.error('Delete error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, action: 'deleted', id: deal.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle deal create/update
    if (type === 'deal_add' || type === 'deal_update' || type === 'deal.add' || type === 'deal.update') {
      if (!deal) {
        return new Response(
          JSON.stringify({ error: 'Missing deal data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const dealId = parseInt(String(deal.id))
      const statusCode = String(deal.status || '')
      const status = STATUS_MAP[statusCode] || statusCode

      // Build record
      const record: Record<string, unknown> = {
        id: dealId,
        raw_data: body, // Store everything as requested
      }

      // Base fields
      if (deal.title) record.title = deal.title
      if (deal.pipeline_title || deal.pipeline) record.pipeline = deal.pipeline_title || deal.pipeline
      if (deal.stage_title || deal.stage) record.stage = deal.stage_title || deal.stage
      if (deal.pipeline) record.group_id = String(deal.pipeline)
      if (deal.stage) record.stage_id = String(deal.stage)
      if (deal.owner) record.owner_id = String(deal.owner)
      if (status) record.status = status
      if (deal.create_date) record.created_at = parseDate(String(deal.create_date))
      record.updated_at = new Date().toISOString()

      // Handle fields array
      const fields = deal.fields
      if (fields && Array.isArray(fields)) {
        for (const field of fields) {
          const f = field as Record<string, unknown>
          const fieldId = String(f.id || f.key || '') // Support both id and key
          let fieldValue = f.value

          // Skip if no value
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') continue

          // Handle array values
          if (Array.isArray(fieldValue)) {
            fieldValue = fieldValue.join(', ')
          }

          const dbColumn = FIELD_MAP[fieldId]
          if (!dbColumn) continue

          const valueStr = String(fieldValue)

          // Type-aware mapping based on column name patterns
          if (dbColumn.startsWith('data_') || dbColumn.endsWith('_date') || dbColumn.includes('_da_a_o') || dbColumn.includes('_do_ganho') || dbColumn.includes('_de_embarque')) {
            const parsed = parseDate(valueStr)
            if (parsed) record[dbColumn] = parsed
          } else if (dbColumn === 'qualificado_sql' || dbColumn === 'pagou_taxa' || dbColumn.includes('?')) {
            record[dbColumn] = parseBoolean(valueStr)
          } else if (dbColumn === 'num_convidados' || dbColumn === 'orcamento' || dbColumn.includes('valor_fechado')) {
            const num = parseNumber(valueStr)
            if (num !== null) record[dbColumn] = num
          } else {
            record[dbColumn] = valueStr
          }
        }
      }

      console.log('Upserting record:', JSON.stringify(record, null, 2))

      const { error } = await supabase
        .from('deals')
        .upsert(record, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('Upsert error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: type.includes('add') ? 'created' : 'updated',
          id: deal.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, action: 'ignored', type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
