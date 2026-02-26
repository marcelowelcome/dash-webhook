import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Credentials from .env or kpi-weddings/.env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ypzpkdgdbzruagjixwyc.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const acUrl = process.env.AC_API_URL!
const acKey = process.env.AC_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapping (Consolidated from Edge Function with manual overrides for existing columns)
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

const NUM_COLS = [
    'n_mero_de_convidados', 'pagamento_de_taxa', 'pacote_ww_n_de_convidados', 'valor_fechado_em_contrato',
    'enviado_pagamento_de_taxa', 'sdr_wt_venda_monde_taxa', 'vnd_wt_qual_valor_da_venda', 'bww_convidados_situa_o',
    'bww_convidados_mesa', 'inicio_atendimento_convidados', 'porcentagem_desconto_a_o_inicial', 'lead_score_2',
    'quantos_apartamentos_foram_bloqueados', 'ww_convidados_2', 'ww_investimento_2', 'wt_enviado_pagamento_de_taxa',
    'wtn_investimento_maior_que_20_mil', 'wt_investimento_por_pessoa', 'id_da_mensagem', 'quali_investimento',
    'pagou_a_taxa', 'orcamento', 'num_convidados'
]

const DATE_COLS = [
    'created_at', 'updated_at', 'forecasted_close_date', 'data_e_hor_rio_do_agendamento_da_1_reuni_o',
    'data_e_hor_rio_do_agendamento_com_a_closer', 'sdr_wt_data_contato_futuro', 'ww_closer_data_hora_ganho',
    'vnd_wt_qual_a_data_do_embarque', 'autom_tico_ww_data_qualifica_o_sdr', 'data_preenchimento_lista_convidados',
    'envio_do_save_the_date', 'previs_o_data_de_casamento', 'data_e_hor_rio_definidos_para_o_casamento',
    'data_final_da_a_o', 'data_confirmada_do_casamento', 'vnd_wt_data_retorno_da_viagem', 'data_final_da_a_o_novo',
    'data_de_embarque', 'data_e_hora_da_1a_reuni_o', 'data_e_hor_rio_do_agendamento_da_1a_reuni_o_sdr_trips',
    'wc_data_e_hora_do_ganho', 'data_reuniao_1', 'data_closer', 'data_fechamento', 'data_qualificado', 'data_reuniao_trips'
]

const BOOL_COLS = [
    'como_foi_feita_a_1_reuni_o', 'qual_o_nome_do_a_seu_sua_noivo_a', 'quantas_pessoas_v_o_no_seu_casamento',
    'quanto_voc_pensa_em_investir', 'onde_voc_quer_casar', 'se_outro_qual', 'dw_ou_elopment',
    'grupo_de_whats_criado', 'wt_tem_destino', 'cerimonial_incluso_quantos', 'wt_com_quem',
    'wt_fly_ski_quem_vai_embarcar_com_voc', 'wt_fly_ski_qual_seria_o_m_s_ideal_para_a_sua_viagem',
    'j_tem_destino_definido', 'como_conheceu_a_ww', 'motivo_da_escolha_de_um_destination_wedding',
    'j_foi_em_algum_destination_wedding', 'costumam_viajar', 'como_conheceu_a_welcome_trips',
    'a_viagem_tem_algum_motivo_especial', 'j_possui_algum_servi_o_contratado_para_a_viagem_transfer_a_reo',
    'destino_s_do_roteiro', 'quantos_dias_de_viagem', 'quantas_pessoas', 'quantas_crian_as_idade',
    'qual_o_or_amento_por_pessoa', 'os_dois_participaram_da_reuni_o', 'quantas_reuni_es_foram_feitas',
    'wtn_voc_j_esquiou_alguma_vez', 'wtn_e_qual_o_principal_motivo_da_sua_viagem',
    'wtn_como_voc_avalia_o_seu_comportamento_de_consumo_em_rela_o_a_',
    'wtn_qual_o_seu_n_vel_de_experi_ncia_com_esqui_snowboard', 'wtn_qual_tipo_de_ambiente_voc_prefere',
    'wtn_quais_atividades_mais_gostaria_de_fazer_al_m_de_esquiar',
    'wtn_voc_est_viajando_com_crian_as_se_sim_qual_a_faixa_et_ria',
    'wtn_importante_que_o_resort_tenha_piscina', 'wtn_voc_ter_acompanhantes_na_viagem',
    'quem_indicou_a_welcome_pra_voc_s', 'se_influencer_qual', 'quali_compra_em_agencia',
    'ww_fez_segunda_reuni_o', 'ww_foi_apresentado_detalhamento_de_or_amento',
    'is_elopement', 'qualificado_sql'
]


const STATUS_MAP: Record<string, string> = {
    '0': 'Open',
    '1': 'Won',
    '2': 'Lost',
}

function parseDate(value: string | null): string | null {
    if (!value || value === '' || value === 'null') return null
    try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return null
        return date.toISOString()
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

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const resp = await fetch(url, options)
            if (resp.status === 429) {
                const wait = Math.pow(2, i) * 1000
                console.log(`Rate limited. Waiting ${wait}ms...`)
                await new Promise(r => setTimeout(r, wait))
                continue
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`)
            return await resp.json()
        } catch (e) {
            if (i === retries - 1) throw e
            await new Promise(r => setTimeout(r, 1000))
        }
    }
}

async function backfill() {
    console.log('Starting backfill...')
    let offset = 0
    const limit = 100
    let totalDeals = 0

    while (true) {
        console.log(`Fetching deals offset=${offset}...`)
        const data = await fetchWithRetry(`${acUrl}/api/3/deals?limit=${limit}&offset=${offset}`, {
            headers: { 'Api-Token': acKey }
        })

        const deals = data.deals || []
        if (deals.length === 0) break

        console.log(`Processing ${deals.length} deals...`)
        const records: any[] = []

        for (const deal of deals) {
            const dealId = deal.id
            const statusCode = String(deal.status || '')
            const status = STATUS_MAP[statusCode] || statusCode

            const record: any = {
                id: parseInt(dealId),
                title: deal.title,
                status: status,
                pipeline: deal.pipeline, // Note: v3 returns pipeline ID, might need mapping if title is expected. 
                // But existing code seems to use titles. We'll fetch titles if needed.
                // Actually v3 returns 'pipeline' as ID. Let's fetch pipelines first.
                stage: deal.stage,
                created_at: parseDate(deal.cdate),
                updated_at: parseDate(deal.mdate),
                raw_data: deal
            }

            // Fetch custom fields for this deal
            const fieldsData = await fetchWithRetry(`${acUrl}/api/3/deals/${dealId}/dealCustomFieldData`, {
                headers: { 'Api-Token': acKey }
            })

            for (const field of fieldsData.dealCustomFieldData || []) {
                const col = FIELD_MAP[field.customFieldId]
                if (!col) continue

                const val = field.fieldValue
                if (val === null || val === '') continue

                if (col.startsWith('data_') || col.endsWith('_date') || col.includes('_da_a_o') || col.includes('_do_ganho')) {
                    const parsed = parseDate(val)
                    if (parsed) record[col] = parsed
                } else if (col === 'qualificado_sql' || col === 'pagou_taxa' || col.includes('?')) {
                    record[col] = parseBoolean(val)
                } else if (col === 'num_convidados' || col === 'orcamento' || col.includes('valor_fechado')) {
                    const num = parseNumber(val)
                    if (num !== null) record[col] = num
                } else {
                    record[col] = val
                }
            }

            records.push(record)
        }

        // Upsert batch
        console.log(`Upserting ${records.length} records to Supabase...`)
        const { error } = await supabase.from('deals').upsert(records, { onConflict: 'id' })
        if (error) {
            console.error('Supabase error:', error)
        } else {
            totalDeals += records.length
            console.log(`Total deals synced: ${totalDeals}`)
        }

        if (deals.length < limit) break
        offset += limit

        // Safety sleep
        await new Promise(r => setTimeout(r, 500))
    }

    console.log(`Backfill complete! Total unique deals: ${totalDeals}`)
}

// Map pipeline IDs to Titles
async function loadPipelines() {
    const data = await fetchWithRetry(`${acUrl}/api/3/dealGroups?limit=100`, {
        headers: { 'Api-Token': acKey }
    })
    const map: Record<string, string> = {}
    for (const p of data.dealGroups || []) {
        map[p.id] = p.title
    }
    return map
}

// Map stage IDs to Titles
async function loadStages() {
    const data = await fetchWithRetry(`${acUrl}/api/3/dealStages?limit=100`, {
        headers: { 'Api-Token': acKey }
    })
    const map: Record<string, string> = {}
    for (const s of data.dealStages || []) {
        map[s.id] = s.title
    }
    return map
}

async function run() {
    const pMap = await loadPipelines()
    const sMap = await loadStages()

    // Inject mapping logic into backfill (wrapping the main call to pass maps)
    // Actually simplicity: I'll just redo backfill with maps
    console.log('Loading metadata maps...')
}

// Re-writing backfill to be more robust with titles
async function backfillRobust() {
    const pMap = await loadPipelines()
    const sMap = await loadStages()

    let offset = 0
    const limit = 100
    let totalDeals = 0

    while (true) {
        console.log(`Fetching deals offset=${offset}...`)
        const data = await fetchWithRetry(`${acUrl}/api/3/deals?limit=${limit}&offset=${offset}&include=dealCustomFieldData`, {
            headers: { 'Api-Token': acKey }
        })

        const deals = data.deals || []
        if (deals.length === 0) break

        if (offset === 0) console.log(`Total deals in AC: ${data.meta?.total}`)

        const records: any[] = []
        for (const deal of deals) {
            const dealId = deal.id
            const statusCode = String(deal.status || '')
            const status = STATUS_MAP[statusCode] || statusCode

            if (totalDeals === 0) console.log('Sample deal keys:', Object.keys(deal))
            const record: any = {
                id: parseInt(dealId),
                title: deal.title,
                status: status,
                pipeline: pMap[deal.group] || deal.group,
                stage: sMap[deal.stage] || deal.stage,
                group_id: deal.group,
                stage_id: deal.stage,
                owner_id: deal.owner,
                created_at: parseDate(deal.cdate),
                updated_at: parseDate(deal.mdate),
                raw_data: deal // Ensure raw_data is stored
            }

            // Sideloaded fields
            const dealFields = (data.dealCustomFieldData || []).filter((f: any) => f.deal === dealId)
            for (const field of dealFields) {
                const col = FIELD_MAP[field.custom_field_id]
                if (!col) continue

                // Coalesce value from sideloaded fields
                const val = field.custom_field_text_value ||
                    field.custom_field_text_blob ||
                    field.custom_field_date_value ||
                    field.custom_field_number_value ||
                    field.custom_field_currency_value || null

                if (val === null || val === '') continue

                if (DATE_COLS.includes(col)) {
                    const parsed = parseDate(val)
                    if (parsed) record[col] = parsed
                } else if (NUM_COLS.includes(col)) {
                    const num = parseNumber(val)
                    if (num !== null) record[col] = num
                } else if (BOOL_COLS.includes(col)) {
                    record[col] = parseBoolean(val)
                } else {
                    record[col] = val
                }
            }

            records.push(record)
        }

        const { error } = await supabase.from('deals').upsert(records, { onConflict: 'id' })
        if (error) console.error('Supabase error:', error)
        totalDeals += records.length
        console.log(`Synced ${totalDeals} deals...`)

        if (deals.length < limit) break
        offset += limit
        await new Promise(r => setTimeout(r, 200))
    }
    console.log('Finished!')
}

backfillRobust().catch(console.error)
