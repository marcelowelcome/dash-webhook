-- ============================================
-- Add all Active Campaign deal fields as columns
-- This enables filtering by any field
-- ============================================

-- Contact info
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_id BIGINT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_first_name TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contact_last_name TEXT;

-- Owner info
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_id BIGINT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_firstname TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_lastname TEXT;

-- Deal value
ALTER TABLE deals ADD COLUMN IF NOT EXISTS value DECIMAL(12,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency TEXT;

-- Pipeline/Stage IDs
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pipeline_id INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_id INTEGER;

-- WW Fields - Noivo(a) info
ALTER TABLE deals ADD COLUMN IF NOT EXISTS email_noivo2 TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS telefone_noivo2 TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cpf_principal TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cpf_noivo2 TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cidade TEXT;

-- WW Fields - Meeting/Reunion
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tipo_reuniao_closer TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS apresentacao_realizada TEXT;

-- WW Fields - Contract/Payment
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pagamento_taxa TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS enviado_taxa TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS prazo_contrato TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS valor_contrato DECIMAL(12,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS venda_monde TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pacote_hotel TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pacote_convidados INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cerimonial_incluso TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS operadora_bloqueio TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hospedagem TEXT;

-- WW Fields - Wedding details
ALTER TABLE deals ADD COLUMN IF NOT EXISTS nome_casal TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS previsao_casamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS previsao_assessoria TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS site_casamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS codigo_casamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_casamento_definida TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS grupo_whats TEXT;

-- WW Fields - Form inputs
ALTER TABLE deals ADD COLUMN IF NOT EXISTS nome_noivo_form TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidados_form TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS investimento_form TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS onde_casar TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS outro_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS dw_ou_elopment TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS como_conheceu TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS porque_dw TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ja_foi_dw TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tempo_relacionamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS costumam_viajar TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS status_relacionamento TEXT;

-- WW Fields - Links
ALTER TABLE deals ADD COLUMN IF NOT EXISTS link_proposeful TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS link_prop_planejamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS link_asaas TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS link_reuniao_sdr TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS link_reuniao_closer TEXT;

-- WW Fields - Loss reasons
ALTER TABLE deals ADD COLUMN IF NOT EXISTS motivo_perda_closer TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS motivo_desqualificacao_sdr TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS motivo_oportunidade_futura TEXT;

-- WW Fields - Source/Origin
ALTER TABLE deals ADD COLUMN IF NOT EXISTS origem_conversao TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fonte_lead TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS influencer TEXT;

-- WW Fields - Guest/Convidado
ALTER TABLE deals ADD COLUMN IF NOT EXISTS mensagem_convidado TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_venda_monde TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_ddi TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_grupo TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_observacao TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_tarifa TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_genero TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_tipo TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_situacao TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS convidado_mesa TEXT;

-- WW Fields - Planning
ALTER TABLE deals ADD COLUMN IF NOT EXISTS consultora_casal TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS login_site TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS senha_site TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_lista_convidados TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS envio_save_date TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS inicio_atendimento TIMESTAMPTZ;

-- WW Fields - Closer extra
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fez_segunda_reuniao TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS apresentou_orcamento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS agendamento_degustacao TEXT;

-- WT (Welcome Trips) Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_tempo_viagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_tem_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_com_quem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_mensagem_extra TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_tem_hospedagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_o_que_busca TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_investimento_pessoa TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_origem_conversao TEXT;

-- WT SDR Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_motivo_perda TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_data_contato TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_venda_monde TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_resumo TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS sdr_wt_influencer TEXT;

-- WT VND (Vendas) Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_motivo_perda TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_venda_monde TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_valor_venda DECIMAL(12,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_data_embarque TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_data_retorno TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS vnd_wt_origem TEXT;

-- WT Fly-Ski Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_flyski_quem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wt_flyski_mes TEXT;

-- WTN (Welcome Trips Neve) Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_ja_esquiou TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_investimento_20k TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_conhece_clubmed TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_motivo_viagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_comportamento_viagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_nivel_esqui TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_tipo_ambiente TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_atividades TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_viaja_criancas TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_piscina TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_info_clubmed TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_acompanhantes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_pacote TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_tempo_viagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_o_que_busca TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wtn_conhece_sol TEXT;

-- WC (WelConnect) Fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_agendamento TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_como_feita TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_motivo_perda TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_qualificacao TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_data_ganho TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_segmento TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_instagram TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS wc_disparo_follow TEXT;

-- Trip details
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_cidade_lead TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_como_conheceu TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_intuito TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_motivo_especial TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_servico_contratado TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_destinos TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_data_embarque TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_dias_viagem INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_pessoas INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_criancas TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_orcamento_pessoa DECIMAL(12,2);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_data_hora_reuniao TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_dois_participaram TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_observacoes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_tipo_hospedagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_qtd_reunioes INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_aptos_bloqueados INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS trip_dados_app TEXT;

-- Qualification fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quali_frequencia TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quali_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quali_compra_agencia TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS quali_investimento TEXT;

-- Misc fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_score INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_final_acao TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS retomar_contato TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS flexibilidade_destino TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS destino_sonhos TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS fluxo_mensagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS id_mensagem TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ultima_mensagem TEXT;

-- WW SDR new fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_sdr_agendamento TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_sdr_como_feita TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_sdr_motivo_perda TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_sdr_qualificacao TEXT;

-- WW Closer new fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_closer_agendamento TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_closer_como_feita TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_closer_motivo_perda TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ww_closer_data_ganho TIMESTAMPTZ;

-- Indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_deals_contact_email ON deals(contact_email);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_nome_casal ON deals(nome_casal);
CREATE INDEX IF NOT EXISTS idx_deals_cidade ON deals(cidade);
