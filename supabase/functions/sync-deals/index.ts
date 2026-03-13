import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── FIELD MAPPING (AC custom field ID → Supabase column) ──────────────────
const FIELD_MAP: Record<string, string> = {
  "1": "forecasted_close_date", "2": "motivo_de_perda", "6": "data_reuniao_1",
  "7": "orcamento", "8": "num_convidados", "14": "nome_do_noivo_a_2",
  "15": "e_mail_do_noivo_a_2", "16": "cidade", "17": "como_reuniao_1",
  "18": "data_closer", "19": "tipo_da_reuni_o_com_a_closer",
  "20": "pagamento_de_taxa", "21": "qual_o_nome_do_a_seu_sua_noivo_a",
  "26": "quantas_pessoas_v_o_no_seu_casamento", "27": "quanto_voc_pensa_em_investir",
  "28": "onde_voc_quer_casar", "29": "se_outro_qual", "30": "dw_ou_elopment",
  "31": "grupo_de_whats_criado", "33": "cpf_contato_principal", "35": "cpf_noivo_a_2",
  "40": "pacote_contratado_no_hotel_e_forma_de_reserva_pagamento",
  "41": "operadora_de_bloqueio", "42": "hospedagem",
  "47": "ww_closer_motivo_de_perda", "51": "mensagem_do_convidado",
  "52": "consultora_casal", "53": "wt_destino", "55": "wt_tem_destino",
  "56": "sdr_wt_motivo_de_perda", "57": "sdr_wt_destino_informado_pelo_lead",
  "58": "sdr_wt_data_contato_futuro", "59": "vnd_wt_motivo_de_perda",
  "60": "vnd_wt_n_da_venda_no_monde", "61": "ww_link_do_proposeful",
  "62": "pacote_ww_n_de_convidados", "64": "valor_fechado_em_contrato",
  "65": "cerimonial_incluso_quantos", "68": "n_mero_da_venda_monde",
  "69": "telefone_noivo_a_2", "70": "prazo_para_devolu_o_do_contrato",
  "71": "enviado_pagamento_de_taxa", "72": "nome_do_casal",
  "73": "wt_mensagem_extra", "74": "sdr_wt_venda_monde_taxa",
  "76": "wt_com_quem", "77": "sdr_wt_resumo_do_neg_cio",
  "79": "link_prop_planejamento", "81": "vnd_wt_origem_do_lead",
  "82": "sdr_wt_a_o_influencer", "83": "motivos_qualificacao_sdr",
  "84": "origem_da_ltima_convers_o", "85": "wt_origem_da_ltima_convers_o",
  "86": "ww_convidado_venda_monde", "87": "data_fechamento",
  "91": "vnd_wt_qual_valor_da_venda", "92": "vnd_wt_qual_a_data_do_embarque",
  "96": "wt_fly_ski_quem_vai_embarcar_com_voc",
  "97": "wt_fly_ski_qual_seria_o_m_s_ideal_para_a_sua_viagem",
  "98": "data_qualificado", "99": "bww_convidado_ddi",
  "100": "bww_convidado_grupo_de_convite", "101": "bww_convidado_observa_o_do_convite",
  "102": "bww_convidado_tarifa_promocional", "103": "bww_convidado_genero",
  "104": "bww_convidado_tipo", "105": "codigo_do_casamento_deal",
  "106": "bww_convidados_situa_o", "107": "bww_convidados_mesa",
  "108": "apresenta_o_realizada", "109": "site_do_casamento",
  "110": "login", "111": "senha", "112": "data_preenchimento_lista_convidados",
  "113": "envio_do_save_the_date", "114": "inicio_atendimento_convidados",
  "117": "previs_o_data_de_casamento", "118": "previs_o_contratar_assessoria",
  "120": "j_tem_destino_definido", "121": "destino",
  "122": "autom_tico_or_amento_por_convidado", "123": "como_conheceu_a_ww",
  "124": "motivo_da_escolha_de_um_destination_wedding",
  "125": "j_foi_em_algum_destination_wedding", "126": "status_do_relacionamento",
  "127": "costumam_viajar", "128": "data_e_hor_rio_definidos_para_o_casamento",
  "129": "data_final_da_a_o", "130": "nome_do_casamento", "131": "local_do_casamento",
  "132": "data_confirmada_do_casamento", "133": "porcentagem_desconto_a_o_inicial",
  "134": "retomar_o_contato_em", "135": "lead_score_2", "136": "wt_planos",
  "140": "telefone", "141": "vnd_wt_data_retorno_da_viagem",
  "142": "data_final_da_a_o_novo",
  "143": "qual_a_cidade_do_lead_para_saber_o_aeroporto",
  "144": "como_conheceu_a_welcome_trips",
  "145": "qual_o_intuito_da_viagem_lazer_lua_de_mel_trabalho_fam_lia",
  "146": "a_viagem_tem_algum_motivo_especial",
  "147": "j_possui_algum_servi_o_contratado_para_a_viagem_transfer_a_reo",
  "148": "destino_s_do_roteiro", "149": "data_de_embarque",
  "150": "quantos_dias_de_viagem", "151": "quantas_pessoas",
  "152": "quantas_crian_as_idade", "153": "qual_o_or_amento_por_pessoa",
  "155": "data_e_hora_da_1a_reuni_o", "156": "os_dois_participaram_da_reuni_o",
  "157": "observa_es", "158": "tipo_de_hospedagem",
  "159": "quantas_reuni_es_foram_feitas", "160": "quantos_apartamentos_foram_bloqueados",
  "161": "dados_do_aplicativo", "163": "ww_convidados_2", "164": "ww_investimento_2",
  "166": "data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips",
  "167": "como_foi_feita_a_1a_reuni_o_sdr_trips",
  "168": "wt_enviado_pagamento_de_taxa", "169": "qualificado_para_sql",
  "177": "wtn_voc_j_esquiou_alguma_vez", "178": "wtn_investimento_maior_que_20_mil",
  "180": "wtn_e_qual_o_principal_motivo_da_sua_viagem",
  "181": "wtn_como_voc_avalia_o_seu_comportamento_de_consumo_em_rela_o_a_",
  "182": "wtn_qual_o_seu_n_vel_de_experi_ncia_com_esqui_snowboard",
  "183": "wtn_qual_tipo_de_ambiente_voc_prefere",
  "184": "wtn_quais_atividades_mais_gostaria_de_fazer_al_m_de_esquiar",
  "185": "wtn_voc_est_viajando_com_crian_as_se_sim_qual_a_faixa_et_ria",
  "186": "wtn_importante_que_o_resort_tenha_piscina",
  "187": "wtn_informa_es_adicionais_clubmed",
  "188": "wtn_voc_ter_acompanhantes_na_viagem", "189": "wtn_op_o_de_pacote",
  "190": "ww_link_do_asaas", "192": "vnd_wt_motivo_perda",
  "257": "wt_tem_hospedagem_contratada", "258": "wt_o_que_voce_esta_buscando",
  "263": "wt_investimento_por_pessoa", "264": "wtn_o_que_voce_esta_buscando",
  "265": "noivo_a_1_nome_completo", "266": "motivo_de_escolher_a_welcome",
  "267": "quem_indicou_a_welcome_pra_voc_s",
  "268": "dw_escreva_com_suas_palavras_os_motivos_pelos_quais_escolheram_",
  "269": "destino_dos_sonhos", "270": "se_influencer_qual",
  "271": "follow_extra_eleg_vel", "272": "fluxo_de_mensagem",
  "273": "id_da_mensagem", "275": "quali_frequ_ncia_em_viagem",
  "276": "quali_destino", "277": "quali_compra_em_agencia",
  "278": "quali_investimento", "279": "ww_fonte_do_lead",
  "280": "wc_agendamento_de_reuni_o", "281": "wc_como_foi_feita_a_reuni_o",
  "282": "wc_motivo_de_perda", "283": "wc_qualifica_o",
  "284": "wc_data_e_hora_do_ganho", "293": "wc_disparo_follow_de_compra",
  "296": "ww_link_reuni_o_teams_sdr", "297": "ww_link_reuni_o_teams_closer",
  "298": "agendamento_degusta_o", "299": "reuniao_closer",
  "300": "wc_segmento", "301": "wc_instagram", "302": "pagou_a_taxa",
  "303": "motivo_desqualifica_o_sdr", "305": "flexibilidade_de_destino",
  "306": "motivo_da_oportunidade_futura", "307": "ww_fez_segunda_reuni_o",
  "308": "ww_foi_apresentado_detalhamento_de_or_amento",
}

const STATUS_MAP: Record<string, string> = { '0': 'Open', '1': 'Won', '2': 'Lost' }

const DATE_COLS = new Set([
  'forecasted_close_date', 'sdr_wt_data_contato_futuro', 'data_fechamento',
  'vnd_wt_qual_a_data_do_embarque', 'data_preenchimento_lista_convidados',
  'envio_do_save_the_date', 'previs_o_data_de_casamento',
  'data_e_hor_rio_definidos_para_o_casamento', 'data_final_da_a_o',
  'data_confirmada_do_casamento', 'vnd_wt_data_retorno_da_viagem',
  'data_final_da_a_o_novo', 'data_de_embarque', 'data_e_hora_da_1a_reuni_o',
  'data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips',
  'wc_data_e_hora_do_ganho', 'data_reuniao_1', 'data_closer',
  'data_qualificado', 'data_reuniao_trips',
])

const NUM_COLS = new Set([
  'pagamento_de_taxa', 'pacote_ww_n_de_convidados', 'valor_fechado_em_contrato',
  'enviado_pagamento_de_taxa', 'sdr_wt_venda_monde_taxa', 'vnd_wt_qual_valor_da_venda',
  'porcentagem_desconto_a_o_inicial', 'lead_score_2', 'ww_convidados_2',
  'ww_investimento_2', 'wt_enviado_pagamento_de_taxa', 'wt_investimento_por_pessoa',
  'id_da_mensagem', 'quali_investimento', 'pagou_a_taxa', 'orcamento', 'num_convidados',
])

const CONV_MAP: Record<string, number> = {
  "apenas o casal": 2, "até 20 convidados": 15,
  "menos de 50 pessoas": 35, "entre 20 a 50 convidados": 35,
  "entre 50 a 80 convidados": 65, "entre 50 e 100 pessoas": 75,
  "entre 80 a 100 convidados": 90,
  "acima de 100 convidados": 120, "mais de 100 pessoas": 120,
}

const ORC_MAP: Record<string, number> = {
  "até r$50 mil": 40000, "menos de r$50 mil": 40000,
  "entre r$50 e r$80 mil": 65000, "entre r$50 e r$100 mil": 75000,
  "entre r$80 e r$100 mil": 90000, "entre r$100 e r$200 mil": 150000,
  "entre r$200 e r$500 mil": 350000, "mais de r$500 mil": 600000,
}

const DESTINO_NORM: Record<string, string> = {
  "nordeste brasileiro": "Nordeste", "caribe/cancún": "Caribe",
  "caribe/cancun": "Caribe", "caribe": "Caribe",
  "itália": "Itália", "italia": "Itália", "portugal": "Portugal",
  "mendoza": "Mendoza", "maldivas": "Maldivas", "europa": "Europa",
  "grécia": "Grécia", "bali": "Bali",
  "patagônia": "Patagônia", "patagonia": "Patagônia",
}

const PIPELINE_GROUP: Record<string, string> = {
  "SDR Weddings": "1", "Closer Weddings": "3", "Planejamento Weddings": "4",
  "Convidados": "5", "Consultoras TRIPS": "6", "SDR - Trips": "8",
  "Convidados - Marcella": "9", "Convidados - Michelly": "10",
  "Convidados - Mariana Rosales": "11", "Elopment Wedding": "12",
  "Presentes Weddings": "14", "WT - Weex Pass": "16", "WW - Internacional": "17",
  "WW - Gestão Casamento ": "18", "WW - Gestão Convidados": "19",
  "Extras Viagem": "20", "WW - Atendimento ao Convidado": "21",
  "Produção": "22", "Controle de Qualidade": "23", "Concierge (+50k)": "24",
  "Coordenação Pós Venda (-50k)": "25", "WT - Expedição NYC - FerStall": "30",
  "Outros Desqualificados | Wedding": "31", "WTN - Desqualificados": "34",
  "WelConnect": "37",
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function parseDate(value: string | null): string | null {
  if (!value || value === '' || value === 'null') return null
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d.toISOString()
  } catch { return null }
}

function parseNumber(value: string | null): number | null {
  if (!value || value === '') return null
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ''))
  return isNaN(num) ? null : num
}

function parseBoolean(value: string | null): boolean {
  if (!value) return false
  const l = String(value).toLowerCase().trim()
  return l === 'yes' || l === 'sim' || l === 'true' || l === '1'
}

function coerce(col: string, val: string): unknown {
  if (DATE_COLS.has(col)) return parseDate(val)
  if (NUM_COLS.has(col)) return parseNumber(val)
  return val
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const resp = await fetch(url, { headers })
    if (resp.status === 429) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
      continue
    }
    return resp
  }
  return fetch(url, { headers })
}

async function loadMap(acUrl: string, endpoint: string, key: string, headers: Record<string, string>): Promise<Record<string, string>> {
  const resp = await fetchWithRetry(`${acUrl}/api/3/${endpoint}?limit=100`, headers)
  if (!resp.ok) return {}
  const data = await resp.json()
  const map: Record<string, string> = {}
  for (const item of data[key] || []) map[item.id] = item.title
  return map
}

function buildRecord(
  deal: Record<string, unknown>,
  fields: Array<Record<string, unknown>>,
  pipelineMap: Record<string, string>,
  stageMap: Record<string, string>,
): Record<string, unknown> {
  const pipelineTitle = pipelineMap[String(deal.group)] || String(deal.group)
  const stageTitle = stageMap[String(deal.stage)] || String(deal.stage)
  const statusCode = String(deal.status || '')

  const record: Record<string, unknown> = {
    id: parseInt(String(deal.id)),
    title: deal.title,
    status: STATUS_MAP[statusCode] || statusCode,
    pipeline: pipelineTitle,
    stage: stageTitle,
    group_id: PIPELINE_GROUP[pipelineTitle] || deal.group,
    stage_id: deal.stage,
    owner_id: deal.owner,
    created_at: parseDate(String(deal.cdate || '')),
    updated_at: parseDate(String(deal.mdate || '')),
    raw_data: deal,
  }

  const rawById: Record<string, string> = {}
  for (const field of fields) {
    const fieldId = String(field.custom_field_id || field.customFieldId || '')
    const val = String(
      field.custom_field_text_value || field.custom_field_text_blob ||
      field.custom_field_date_value || field.custom_field_number_value ||
      field.custom_field_currency_value || field.fieldValue || ''
    ).trim()

    if (!val) continue
    rawById[fieldId] = val

    const col = FIELD_MAP[fieldId]
    if (!col) continue

    const coerced = coerce(col, val)
    if (coerced !== null && coerced !== undefined) record[col] = coerced
  }

  // Fallback: destino from form field 28
  if (!record.destino) {
    const raw28 = rawById['28']
    if (raw28) {
      record.destino = raw28 === 'Outro'
        ? (rawById['29'] || 'Outro')
        : (DESTINO_NORM[raw28.toLowerCase()] ?? raw28)
    }
  }
  // Fallback: num_convidados from form field 26
  if (!record.num_convidados) {
    const raw26 = rawById['26']
    if (raw26) {
      const v = CONV_MAP[raw26.toLowerCase()]
      if (v !== undefined) record.num_convidados = v
    }
  }
  // Fallback: orcamento from form field 27
  if (!record.orcamento) {
    const raw27 = rawById['27']
    if (raw27) {
      const v = ORC_MAP[raw27.toLowerCase()]
      if (v !== undefined) record.orcamento = v
    }
  }

  return record
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const acUrl = Deno.env.get('AC_API_URL')
  const acKey = Deno.env.get('AC_API_KEY')

  if (!acUrl || !acKey) {
    return new Response(
      JSON.stringify({ error: 'AC_API_URL or AC_API_KEY not set in Supabase secrets' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const acHeaders = { 'Api-Token': acKey }

  try {
    // Parse optional parameters from request body
    let hoursBack = 3
    let maxPages = 50
    let triggerSource = 'cron'
    try {
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}))
        if (body.hours_back && typeof body.hours_back === 'number') hoursBack = body.hours_back
        if (body.max_pages && typeof body.max_pages === 'number') maxPages = body.max_pages
        if (body.source && typeof body.source === 'string') triggerSource = body.source
      }
    } catch { /* ignore parse errors */ }

    const [pipelineMap, stageMap] = await Promise.all([
      loadMap(acUrl, 'dealGroups', 'dealGroups', acHeaders),
      loadMap(acUrl, 'dealStages', 'dealStages', acHeaders),
    ])

    // Sync window: configurable (default 3 hours for cron)
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
    const sinceISO = since.toISOString().replace('T', ' ').slice(0, 19)

    let offset = 0
    const limit = 100
    let synced = 0
    let pages = 0
    const errors: string[] = []

    while (true) {
      pages++
      const url = `${acUrl}/api/3/deals?limit=${limit}&offset=${offset}` +
        `&filters[updated_timestamp][gte]=${encodeURIComponent(sinceISO)}` +
        `&include=dealCustomFieldData&orders[mdate]=DESC`

      const resp = await fetchWithRetry(url, acHeaders)
      if (!resp.ok) {
        const text = await resp.text()
        errors.push(`AC API error page ${pages}: ${resp.status} ${text.slice(0, 200)}`)
        break
      }

      const data = await resp.json()
      const deals = (data.deals || []) as Array<Record<string, unknown>>
      if (deals.length === 0) break

      const allFields = (data.dealCustomFieldData || []) as Array<Record<string, unknown>>

      const records: Record<string, unknown>[] = []
      for (const deal of deals) {
        const dealId = String(deal.id)
        const dealFields = allFields.filter((f) => String(f.deal_id || f.deal) === dealId)
        records.push(buildRecord(deal, dealFields, pipelineMap, stageMap))
      }

      const { error } = await supabase.from('deals').upsert(records, { onConflict: 'id' })
      if (error) {
        errors.push(`Supabase upsert error page ${pages}: ${error.message}`)
      } else {
        synced += records.length
      }

      if (deals.length < limit) break
      if (pages >= maxPages) {
        errors.push(`Reached max pages (${maxPages}), stopping. Use max_pages param for more.`)
        break
      }
      offset += limit
      await new Promise(r => setTimeout(r, 250))
    }

    // Log sync execution
    await supabase.from('sync_logs').insert({
      finished_at: new Date().toISOString(),
      hours_back: hoursBack,
      synced,
      pages,
      errors: errors.length > 0 ? errors : null,
      trigger_source: triggerSource,
      window_start: sinceISO,
      window_end: new Date().toISOString().replace('T', ' ').slice(0, 19),
    })

    const result = {
      success: true,
      syncedAt: new Date().toISOString(),
      hoursBack,
      window: `${sinceISO} → now`,
      synced,
      pages,
      errors: errors.length > 0 ? errors : undefined,
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Sync failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
