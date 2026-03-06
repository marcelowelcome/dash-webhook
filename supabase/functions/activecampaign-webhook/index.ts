import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AC field KEY names to DB columns mapping (complete)
const FIELD_KEY_MAP: Record<string, string> = {
  // === WW Core Funnel Fields (existing columns) ===
  'Data e horário do agendamento da 1ª reunião': 'data_reuniao_1',
  'Como foi feita a 1ª reunião?': 'como_reuniao_1',
  'Data e horário do agendamento com a Closer:': 'data_closer',
  'Motivos de qualificação SDR': 'motivos_qualificacao_sdr',
  '[WW] [Closer] Data-Hora Ganho': 'data_fechamento',
  ' [WW] [Closer] Data-Hora Ganho': 'data_fechamento', // with leading space
  'Automático - WW - Data Qualificação SDR': 'data_qualificado',
  'Qualificado para SQL': 'qualificado_sql',
  'WW | Como foi feita Reunião Closer': 'reuniao_closer',
  'Motivo de perda': 'motivo_perda',
  'Nome do Noivo(a)2': 'nome_noivo',
  'Número de convidados:': 'num_convidados',
  'Orçamento:': 'orcamento',
  'Destino': 'destino',

  // === Trips Core Fields (existing columns) ===
  'Data e horário do agendamento da 1a. Reunião SDR TRIPS': 'data_reuniao_trips',
  'Como foi feita a 1a. Reunião SDR TRIPS': 'como_reuniao_trips',
  'Pagou a taxa?': 'pagou_taxa',

  // === WW Noivo(a) Info ===
  'E-mail do Noivo(a)2': 'email_noivo2',
  'Telefone noivo(a)2': 'telefone_noivo2',
  'CPF contato principal': 'cpf_principal',
  'CPF noivo(a)2': 'cpf_noivo2',
  'Cidade:': 'cidade',
  'Qual é o nome do(a) seu(sua) noivo(a)?': 'nome_noivo_form',

  // === WW Meeting Fields ===
  'Tipo da reunião com a Closer:': 'tipo_reuniao_closer',
  'Apresentação Realizada': 'apresentacao_realizada',
  'WW | Fez segunda reunião?': 'fez_segunda_reuniao',
  'WW | Foi apresentado detalhamento de orçamento?': 'apresentou_orcamento',
  'Agendamento Degustação': 'agendamento_degustacao',

  // === WW Contract/Payment ===
  'Pagamento de Taxa?': 'pagamento_taxa',
  'Enviado pagamento de taxa?': 'enviado_taxa',
  'Prazo para devolução do contrato': 'prazo_contrato',
  'Valor fechado em contrato:': 'valor_contrato',
  'Número da Venda MONDE': 'venda_monde',
  'Pacote contratado no hotel e forma de reserva/pagamento': 'pacote_hotel',
  'Pacote WW - Nº de Convidados': 'pacote_convidados',
  'Cerimonial incluso? Quantos?': 'cerimonial_incluso',
  'Operadora de bloqueio:': 'operadora_bloqueio',
  'Hospedagem:': 'hospedagem',

  // === WW Wedding Details ===
  'Nome do Casal': 'nome_casal',
  'Previsão data de casamento': 'previsao_casamento',
  'Previsão contratar assessoria': 'previsao_assessoria',
  'Site do Casamento': 'site_casamento',
  'Codigo do Casamento Deal': 'codigo_casamento',
  'Data e horário definidos para o casamento:': 'data_casamento_definida',
  'Grupo de whats criado?': 'grupo_whats',

  // === WW Form Inputs ===
  'Quantas pessoas vão no seu casamento?': 'convidados_form',
  'Quanto você pensa em investir?*': 'investimento_form',
  'Onde você quer casar?*': 'onde_casar',
  ' Se "Outro", qual?': 'outro_destino',
  'DW ou Elopment?': 'dw_ou_elopment',
  'Como conheceu a WW?': 'como_conheceu',
  'INATIVO - Por que escolheu fazer um DW? Já foi em algum?': 'porque_dw',
  'Motivo da escolha de um Destination Wedding?': 'porque_dw',
  'Já foi em algum Destination Wedding?': 'ja_foi_dw',
  'Tempo de relacionamento': 'tempo_relacionamento',
  'Costumam Viajar?': 'costumam_viajar',
  'Status do relacionamento': 'status_relacionamento',
  ' Já tem destino definido?': 'wt_tem_destino',

  // === WW Links ===
  'WW - Link do proposeful': 'link_proposeful',
  'Link prop planejamento:': 'link_prop_planejamento',
  'WW - Link do Asaas': 'link_asaas',
  'WW | Link Reunião Teams SDR': 'link_reuniao_sdr',
  'WW | Link Reunião Teams Closer': 'link_reuniao_closer',

  // === WW Loss/Qualification ===
  '[WW] [Closer] Motivo de Perda': 'motivo_perda_closer',
  'Motivo desqualificação SDR': 'motivo_desqualificacao_sdr',
  'Motivo da oportunidade futura': 'motivo_oportunidade_futura',

  // === WW Source/Origin ===
  'Origem da última conversão:': 'origem_conversao',
  'WW | Fonte do lead': 'fonte_lead',
  'Se influencer, Qual?': 'influencer',

  // === WW Guest/Convidado ===
  'Mensagem do Convidado': 'mensagem_convidado',
  'WW-Convidado-Venda Monde': 'convidado_venda_monde',
  'BWW-Convidado-DDI': 'convidado_ddi',
  'BWW-Convidado-Grupo de Convite': 'convidado_grupo',
  'BWW-Convidado-Observação do Convite': 'convidado_observacao',
  'BWW-Convidado-Tarifa Promocional': 'convidado_tarifa',
  'BWW-Convidado-Genero': 'convidado_genero',
  'BWW-Convidado-Tipo': 'convidado_tipo',
  ' BWW-Convidados-Situação': 'convidado_situacao',
  'BWW-Convidados-Mesa': 'convidado_mesa',

  // === WW Planning ===
  'Consultora-Casal': 'consultora_casal',
  'Login': 'login_site',
  'Senha': 'senha_site',
  'Data Preenchimento Lista Convidados': 'data_lista_convidados',
  'Envio do Save the Date': 'envio_save_date',
  'Inicio Atendimento Convidados': 'inicio_atendimento',

  // === WW SDR New Fields ===
  'WW | SDR | Agendamento': 'ww_sdr_agendamento',
  'WW | SDR | Como foi feita': 'ww_sdr_como_feita',
  'WW | SDR | Motivo de Perda': 'ww_sdr_motivo_perda',
  'WW | SDR | Motivo de Qualificação': 'ww_sdr_qualificacao',

  // === WW Closer New Fields ===
  'WW | Closer | Agendamento': 'ww_closer_agendamento',
  'WW | Closer | Como foi feita': 'ww_closer_como_feita',
  'WW | Closer | Motivo de Perda': 'ww_closer_motivo_perda',
  'WW | Closer | Data Ganho': 'ww_closer_data_ganho',

  // === WT (Welcome Trips) Fields ===
  'WT Destino': 'wt_destino',
  'WT Tempo para Viagem': 'wt_tempo_viagem',
  'WT Tem destino?': 'wt_tem_destino',
  'WT - Com quem?': 'wt_com_quem',
  'WT - Mensagem Extra': 'wt_mensagem_extra',
  'WT Tem Hospedagem contratada': 'wt_tem_hospedagem',
  'WT O que voce esta buscando': 'wt_o_que_busca',
  'WT Investimento por Pessoa': 'wt_investimento_pessoa',
  '[WT]Origem da última conversão:': 'wt_origem_conversao',

  // === WT SDR Fields ===
  'SDR WT - Motivo de Perda': 'sdr_wt_motivo_perda',
  'SDR WT - Destino informado pelo lead': 'sdr_wt_destino',
  'SDR WT - Data Contato Futuro': 'sdr_wt_data_contato',
  'SDR WT - Venda Monde (taxa)': 'sdr_wt_venda_monde',
  'SDR WT - Resumo do negócio': 'sdr_wt_resumo',
  'SDR WT - Ação Influencer': 'sdr_wt_influencer',

  // === WT VND (Vendas) Fields ===
  'VND WT - Motivo de Perda': 'vnd_wt_motivo_perda',
  'VND WT - Nº da venda no Monde': 'vnd_wt_venda_monde',
  'VND WT - Qual valor da venda?': 'vnd_wt_valor_venda',
  'VND WT - Qual a data do embarque?': 'vnd_wt_data_embarque',
  'VND WT - Data Retorno da viagem': 'vnd_wt_data_retorno',
  'VND WT - Origem do lead': 'vnd_wt_origem',

  // === WT Fly-Ski Fields ===
  ' WT - Fly-Ski - Quem vai embarcar com você?': 'wt_flyski_quem',
  'WT - Fly-Ski - Quem vai embarcar com você?': 'wt_flyski_quem',
  ' WT - Fly-Ski - Qual seria o mês ideal para a sua viagem?': 'wt_flyski_mes',
  'WT - Fly-Ski - Qual seria o mês ideal para a sua viagem?': 'wt_flyski_mes',

  // === WTN (Welcome Trips Neve) Fields ===
  'WTN - Você já esquiou alguma vez?': 'wtn_ja_esquiou',
  'WTN - Investimento é maior que 20 mil?': 'wtn_investimento_20k',
  'WTN - Você já conhece a Temporada de Neve Club Med?': 'wtn_conhece_clubmed',
  'WTN - E qual é o principal motivo da sua viagem ?': 'wtn_motivo_viagem',
  'WTN -Como você avalia o seu comportamento de consumo em relação a viagens internacionais?': 'wtn_comportamento_viagem',
  'WTN -Qual é o seu nível de experiência com esqui/snowboard?': 'wtn_nivel_esqui',
  'WTN - Qual tipo de ambiente você prefere?': 'wtn_tipo_ambiente',
  'WTN -Quais atividades mais gostaria de fazer além de esquiar?': 'wtn_atividades',
  'WTN -Você está viajando com crianças? Se sim, qual a faixa etária?': 'wtn_viaja_criancas',
  'WTN - É importante que o resort tenha piscina?': 'wtn_piscina',
  'WTN - Informações adicionais - ClubMed': 'wtn_info_clubmed',
  'WTN - Você terá acompanhantes na viagem?': 'wtn_acompanhantes',
  'WTN - Opção de pacote': 'wtn_pacote',
  'WTN - Em quanto tempo você pretende fazer essa viagem?': 'wtn_tempo_viagem',
  'WTN O que voce esta buscando': 'wtn_o_que_busca',
  'Você já conhece a Temporada de Sol Club Med?': 'wtn_conhece_sol',

  // === WC (WelConnect) Fields ===
  'WC | Agendamento de Reunião': 'wc_agendamento',
  'WC | Como foi Feita a Reunião': 'wc_como_feita',
  'WC | Motivo de Perda': 'wc_motivo_perda',
  'WC | Qualificação': 'wc_qualificacao',
  'WC | Data e Hora do Ganho': 'wc_data_ganho',
  'WC | Segmento': 'wc_segmento',
  'WC | Instagram': 'wc_instagram',
  'WC | Disparo Follow de Compra': 'wc_disparo_follow',

  // === Trip Details ===
  'Qual a cidade do lead (para saber o aeroporto).': 'trip_cidade_lead',
  'Como conheceu a Welcome Trips?': 'trip_como_conheceu',
  'Qual o intuito da viagem (lazer, lua de mel, trabalho, família...)': 'trip_intuito',
  'A viagem tem algum motivo especial?': 'trip_motivo_especial',
  'Já possui algum serviço contratado para a viagem? (transfer / aéreo...)': 'trip_servico_contratado',
  'Destino(s) do roteiro?': 'trip_destinos',
  'Data de embarque?': 'trip_data_embarque',
  'Quantos dias de viagem?': 'trip_dias_viagem',
  'Quantas pessoas?': 'trip_pessoas',
  'Quantas crianças? Idade?': 'trip_criancas',
  'Qual o orçamento por pessoa?': 'trip_orcamento_pessoa',
  'Data e Hora da 1a. Reunião:': 'trip_data_hora_reuniao',
  'Os dois participaram da reunião?': 'trip_dois_participaram',
  'Observações:': 'trip_observacoes',
  'Tipo de Hospedagem:': 'trip_tipo_hospedagem',
  'Quantas reuniões foram feitas?': 'trip_qtd_reunioes',
  'Quantos apartamentos foram bloqueados?': 'trip_aptos_bloqueados',
  'Dados do Aplicativo': 'trip_dados_app',

  // === Qualification Fields ===
  'QUALI - Frequência em viagem': 'quali_frequencia',
  'QUALI - Destino': 'quali_destino',
  'QUALI - Compra em Agencia?': 'quali_compra_agencia',
  'QUALI - Investimento': 'quali_investimento',

  // === Misc Fields ===
  'Lead Score 2': 'lead_score',
  'Data Final da Ação': 'data_final_acao',
  'Data Final da Ação (NOVO)': 'data_final_acao',
  'Retomar o contato em:': 'retomar_contato',
  'Flexibilidade de Destino': 'flexibilidade_destino',
  'Destino dos sonhos': 'destino_sonhos',
  'Fluxo de Mensagem': 'fluxo_mensagem',
  'ID da Mensagem': 'id_mensagem',
  'WW/WT | Última Mensagem': 'ultima_mensagem',
}

// AC field ID to DB columns mapping (fallback when key is not found)
const FIELD_ID_MAP: Record<string, string> = {
  // WW Core Funnel
  '6': 'data_reuniao_1',
  '17': 'como_reuniao_1',
  '18': 'data_closer',
  '83': 'motivos_qualificacao_sdr',
  '87': 'data_fechamento',
  '98': 'data_qualificado',
  '169': 'qualificado_sql',
  '299': 'reuniao_closer',
  '2': 'motivo_perda',
  '14': 'nome_noivo',
  '8': 'num_convidados',
  '7': 'orcamento',
  '121': 'destino',
  // Trips Core
  '166': 'data_reuniao_trips',
  '167': 'como_reuniao_trips',
  '302': 'pagou_taxa',
  // WW Extra
  '15': 'email_noivo2',
  '69': 'telefone_noivo2',
  '33': 'cpf_principal',
  '35': 'cpf_noivo2',
  '16': 'cidade',
  '19': 'tipo_reuniao_closer',
  '20': 'pagamento_taxa',
  '71': 'enviado_taxa',
  '70': 'prazo_contrato',
  '64': 'valor_contrato',
  '68': 'venda_monde',
  '40': 'pacote_hotel',
  '62': 'pacote_convidados',
  '65': 'cerimonial_incluso',
  '41': 'operadora_bloqueio',
  '42': 'hospedagem',
  '72': 'nome_casal',
  '117': 'previsao_casamento',
  '118': 'previsao_assessoria',
  '109': 'site_casamento',
  '105': 'codigo_casamento',
  '128': 'data_casamento_definida',
  '31': 'grupo_whats',
  '61': 'link_proposeful',
  '79': 'link_prop_planejamento',
  '190': 'link_asaas',
  '296': 'link_reuniao_sdr',
  '297': 'link_reuniao_closer',
  '47': 'motivo_perda_closer',
  '303': 'motivo_desqualificacao_sdr',
  '306': 'motivo_oportunidade_futura',
  '84': 'origem_conversao',
  '279': 'fonte_lead',
  '270': 'influencer',
  '51': 'mensagem_convidado',
  '86': 'convidado_venda_monde',
  '52': 'consultora_casal',
  '110': 'login_site',
  '111': 'senha_site',
  '112': 'data_lista_convidados',
  '113': 'envio_save_date',
  '114': 'inicio_atendimento',
  '307': 'fez_segunda_reuniao',
  '308': 'apresentou_orcamento',
  '298': 'agendamento_degustacao',
  // WW SDR/Closer new fields
  '380': 'ww_sdr_agendamento',
  '381': 'ww_sdr_como_feita',
  '382': 'ww_sdr_motivo_perda',
  '383': 'ww_sdr_qualificacao',
  '384': 'ww_closer_agendamento',
  '385': 'ww_closer_como_feita',
  '386': 'ww_closer_motivo_perda',
  '387': 'ww_closer_data_ganho',
  // WT Fields
  '53': 'wt_destino',
  '54': 'wt_tempo_viagem',
  '55': 'wt_tem_destino',
  '76': 'wt_com_quem',
  '73': 'wt_mensagem_extra',
  '257': 'wt_tem_hospedagem',
  '258': 'wt_o_que_busca',
  '263': 'wt_investimento_pessoa',
  '85': 'wt_origem_conversao',
  // WT SDR
  '56': 'sdr_wt_motivo_perda',
  '57': 'sdr_wt_destino',
  '58': 'sdr_wt_data_contato',
  '74': 'sdr_wt_venda_monde',
  '77': 'sdr_wt_resumo',
  '82': 'sdr_wt_influencer',
  // WT VND
  '59': 'vnd_wt_motivo_perda',
  '60': 'vnd_wt_venda_monde',
  '91': 'vnd_wt_valor_venda',
  '92': 'vnd_wt_data_embarque',
  '141': 'vnd_wt_data_retorno',
  '81': 'vnd_wt_origem',
  // WT Fly-Ski
  '96': 'wt_flyski_quem',
  '97': 'wt_flyski_mes',
  // WTN
  '177': 'wtn_ja_esquiou',
  '178': 'wtn_investimento_20k',
  '179': 'wtn_conhece_clubmed',
  '180': 'wtn_motivo_viagem',
  '181': 'wtn_comportamento_viagem',
  '182': 'wtn_nivel_esqui',
  '183': 'wtn_tipo_ambiente',
  '184': 'wtn_atividades',
  '185': 'wtn_viaja_criancas',
  '186': 'wtn_piscina',
  '187': 'wtn_info_clubmed',
  '188': 'wtn_acompanhantes',
  '189': 'wtn_pacote',
  '262': 'wtn_tempo_viagem',
  '264': 'wtn_o_que_busca',
  '274': 'wtn_conhece_sol',
  // WC
  '280': 'wc_agendamento',
  '281': 'wc_como_feita',
  '282': 'wc_motivo_perda',
  '283': 'wc_qualificacao',
  '284': 'wc_data_ganho',
  '300': 'wc_segmento',
  '301': 'wc_instagram',
  '293': 'wc_disparo_follow',
  // Trip details
  '143': 'trip_cidade_lead',
  '144': 'trip_como_conheceu',
  '145': 'trip_intuito',
  '146': 'trip_motivo_especial',
  '147': 'trip_servico_contratado',
  '148': 'trip_destinos',
  '149': 'trip_data_embarque',
  '150': 'trip_dias_viagem',
  '151': 'trip_pessoas',
  '152': 'trip_criancas',
  '153': 'trip_orcamento_pessoa',
  '155': 'trip_data_hora_reuniao',
  '156': 'trip_dois_participaram',
  '157': 'trip_observacoes',
  '158': 'trip_tipo_hospedagem',
  '159': 'trip_qtd_reunioes',
  '160': 'trip_aptos_bloqueados',
  '161': 'trip_dados_app',
  // Qualification
  '275': 'quali_frequencia',
  '276': 'quali_destino',
  '277': 'quali_compra_agencia',
  '278': 'quali_investimento',
  // Misc
  '135': 'lead_score',
  '129': 'data_final_acao',
  '142': 'data_final_acao',
  '134': 'retomar_contato',
  '305': 'flexibilidade_destino',
  '269': 'destino_sonhos',
  '272': 'fluxo_mensagem',
  '273': 'id_mensagem',
  '353': 'ultima_mensagem',
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
    const contact = body.contact as Record<string, unknown> | undefined

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

      // Build record with only fields that have values
      const record: Record<string, unknown> = {
        id: dealId,
      }

      // Only set base fields if they have values
      if (deal.title) record.title = deal.title
      if (deal.pipeline_title || deal.pipeline) record.pipeline = deal.pipeline_title || deal.pipeline
      if (deal.stage_title || deal.stage) record.stage = deal.stage_title || deal.stage
      if (status) record.status = status
      if (deal.create_date) record.created_at = parseDate(String(deal.create_date))
      record.updated_at = new Date().toISOString()

      // Contact info
      if (deal.contactid) record.contact_id = parseInt(String(deal.contactid))
      if (deal.contact_email) record.contact_email = deal.contact_email
      if (deal.contact_firstname) record.contact_first_name = deal.contact_firstname
      if (deal.contact_lastname) record.contact_last_name = deal.contact_lastname

      // Owner info
      if (deal.owner) record.owner_id = parseInt(String(deal.owner))
      if (deal.owner_firstname) record.owner_firstname = deal.owner_firstname
      if (deal.owner_lastname) record.owner_lastname = deal.owner_lastname

      // Deal value
      if (deal.value) record.value = parseFloat(String(deal.value))
      if (deal.currency) record.currency = deal.currency

      // Pipeline/Stage IDs
      if (deal.pipelineid) record.pipeline_id = parseInt(String(deal.pipelineid))
      if (deal.stageid) record.stage_id = parseInt(String(deal.stageid))

      // Contact phone from body.contact
      if (contact?.phone) record.contact_phone = String(contact.phone).trim()

      // Handle fields array - only set fields that AC explicitly sends with values
      const fields = deal.fields
      if (fields && Array.isArray(fields)) {
        for (const field of fields) {
          const f = field as Record<string, unknown>
          const fieldKey = String(f.key || '')
          const fieldId = String(f.id || '')
          let fieldValue = f.value

          // Skip if no value
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') continue

          // Handle array values
          if (Array.isArray(fieldValue)) {
            fieldValue = fieldValue.join(', ')
          }

          // Try to find DB column by key name first, then by ID
          const dbColumn = FIELD_KEY_MAP[fieldKey] || FIELD_ID_MAP[fieldId]
          if (!dbColumn) continue

          const valueStr = String(fieldValue)

          switch (dbColumn) {
            // Date fields
            case 'data_reuniao_1':
            case 'data_qualificado':
            case 'data_closer':
            case 'data_fechamento':
            case 'data_reuniao_trips':
            case 'data_casamento_definida':
            case 'data_lista_convidados':
            case 'envio_save_date':
            case 'inicio_atendimento':
            case 'sdr_wt_data_contato':
            case 'vnd_wt_data_embarque':
            case 'vnd_wt_data_retorno':
            case 'wc_agendamento':
            case 'wc_data_ganho':
            case 'trip_data_embarque':
            case 'trip_data_hora_reuniao':
            case 'data_final_acao':
            case 'retomar_contato':
            case 'ww_sdr_agendamento':
            case 'ww_closer_agendamento':
            case 'ww_closer_data_ganho': {
              const parsed = parseDate(valueStr)
              if (parsed) record[dbColumn] = parsed
              break
            }
            // Boolean fields
            case 'qualificado_sql':
            case 'pagou_taxa':
              record[dbColumn] = parseBoolean(valueStr)
              break
            // Number fields
            case 'num_convidados':
            case 'orcamento':
            case 'valor_contrato':
            case 'pacote_convidados':
            case 'vnd_wt_valor_venda':
            case 'trip_dias_viagem':
            case 'trip_pessoas':
            case 'trip_orcamento_pessoa':
            case 'trip_qtd_reunioes':
            case 'trip_aptos_bloqueados':
            case 'lead_score': {
              const num = parseNumber(valueStr)
              if (num !== null) record[dbColumn] = num
              break
            }
            // Text fields
            default:
              if (valueStr) record[dbColumn] = valueStr
          }
        }
      }

      console.log('Upserting record:', JSON.stringify(record, null, 2))

      // Use upsert with ignoreDuplicates=false to merge, not replace
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
