# Dicionário de Dados — Welcome Weddings

> Gerado em 19/03/2026 | Base: 23.788 deals | Fonte: Supabase (ActiveDash)
>
> Fonte única de mapeamento: `supabase/functions/_shared/field-maps.ts`

---

## Visão Geral

| Métrica | Valor |
|---------|-------|
| Total de deals | 23.788 |
| Colunas na tabela `deals` | 141 |
| Colunas usadas pelo dashboard | 44 |
| Campos AC mapeados (por ID) | 173 |
| Campos AC mapeados (por key) | 174 |
| Colunas com >50% preenchimento | 14 |
| Colunas com 0% preenchimento | 3 |

### Distribuição por Pipeline

| Pipeline | group_id | Deals | % |
|----------|----------|-------|---|
| SDR Weddings | 1 | 4.224 | 17,8% |
| SDR - Trips | 8 | 5.150 | 21,6% |
| Elopment Wedding | 12 | 2.162 | 9,1% |
| Closer Weddings | 3 | 543 | 2,3% |
| Outros Desqualificados | 31 | 188 | 0,8% |
| WW - Internacional | 17 | 78 | 0,3% |
| Planejamento Weddings | 4 | 75 | 0,3% |
| Demais pipelines | — | 11.368 | 47,8% |

### Distribuição por Status

| Status | Deals | % |
|--------|-------|---|
| Lost | 11.802 | 49,6% |
| Won | 7.378 | 31,0% |
| Open | 4.608 | 19,4% |

---

## 1. CAMPOS DE IDENTIFICAÇÃO E CONTROLE

> Campos estruturais que identificam e classificam cada deal.

| Coluna | Tipo SQL | Preench. | % | Origem AC | Usado no Dashboard | Criticidade |
|--------|----------|----------|---|-----------|-------------------|-------------|
| `id` | BIGINT PK | 23.788 | 100% | deal.id | Sim — chave única | **Crítico** |
| `title` | TEXT | 23.785 | 100% | deal.title | Sim — exibição, filtro elopment | Auxiliar |
| `pipeline` | TEXT | 23.788 | 100% | deal.pipeline_title | Sim — filtro por negócio | **Crítico** |
| `stage` | TEXT | 23.788 | 100% | deal.stage_title | Sim — funil, StandBy detection | Importante |
| `status` | TEXT | 23.788 | 100% | STATUS_MAP[deal.status] | Sim — Won/Open/Lost | **Crítico** |
| `group_id` | TEXT | 23.788 | 100% | PIPELINE_GROUP[pipeline] | Sim — segregação SDR/Closer | **Crítico** |
| `stage_id` | TEXT | 23.571 | 99,1% | deal.stageid | Sim — filtro por estágio | Auxiliar |
| `owner_id` | TEXT | 23.786 | 100% | deal.owner | Sim — ranking SDR, atribuição | **Crítico** |
| `pipeline_id` | — | 0 | 0% | — | Sim (funnel-utils) | Vazio |
| `is_elopement` | BOOL (GEN) | 23.788 | 100% | Gerado (pipeline='Elopment Wedding') | Sim — filtro elopment | Auxiliar |
| `raw_data` | JSONB | 23.786 | 100% | Payload completo | Não — debug/reprocessamento | Infraestrutura |

---

## 2. CAMPOS TEMPORAIS

> Timestamps que controlam o ciclo de vida do deal e alimentam métricas de velocidade.

| Coluna | Tipo SQL | Preench. | % | Usado para | Criticidade |
|--------|----------|----------|---|-----------|-------------|
| `created_at` | TIMESTAMPTZ | 23.788 | 100% | Timeline semanal/mensal, idade do deal, velocidade de funil | **Crítico** |
| `updated_at` | TIMESTAMPTZ | 23.788 | 100% | Sync health, trigger upsert_newer, cache invalidation | **Crítico** |
| `data_fechamento` | TIMESTAMPTZ | 148 | 0,6% | **FONTE DE VERDADE para "Ganho"** (≠ null → Won) | **Crítico** |
| `ww_closer_data_hora_ganho` | TIMESTAMPTZ | 145 | 0,6% | Fallback legacy para data_fechamento | Legacy |
| `data_reuniao_1` | TIMESTAMPTZ | 1.897 | 8,0% | Taxa de agendamento, no-show SDR | Importante |
| `data_closer` | TIMESTAMPTZ | 822 | 3,5% | Taxa de closer agendada | Importante |
| `data_qualificado` | TIMESTAMPTZ | 735 | 3,1% | Data da qualificação SQL | Auxiliar |
| `previs_o_data_de_casamento` | TIMESTAMPTZ | 31 | 0,1% | Lead score, planejamento | Auxiliar |

---

## 3. MÉTRICAS DE RECEITA E TICKET

> Valores financeiros usados para cálculos de receita, ticket médio e projeções.

| Coluna | Tipo SQL | Preench. Global | Preench. Closer (n=543) | Usado para | Criticidade |
|--------|----------|-----------------|------------------------|-----------|-------------|
| `valor_fechado_em_contrato` | DECIMAL(12,2) | 445 (1,9%) | 262 (48,3%) | **Receita total, ticket médio, receita por destino** | **Crítico** |
| `orcamento` | DECIMAL(12,2) | 5.865 (24,7%) | — | Lead score (proximidade do ticket), perfil do lead | Importante |
| `num_convidados` | INTEGER | 6.337 (26,6%) | — | Ticket por convidado, lead score (mediana) | Importante |
| `pagamento_de_taxa` | DECIMAL(12,2) | 29 (0,1%) | — | Análise de taxa paga | Auxiliar |
| `pagou_a_taxa` | DECIMAL(12,2) | 7 (0,0%) | — | Flag taxa paga (dashboard _cf) | Auxiliar |
| `wt_enviado_pagamento_de_taxa` | DECIMAL(12,2) | 99 (0,4%) | — | Flag taxa enviada (dashboard _cf) | Auxiliar |
| `lead_score_2` | DECIMAL(12,2) | 0 | 0% | Score AC (não utilizado atualmente) | Vazio |

---

## 4. MÉTRICAS DE FUNIL SDR

> Campos que alimentam o funil de SDR: MQL → Agendamento → Reunião → Qualificação → Closer.
>
> **Contexto**: SDR Weddings = 4.224 deals (group_id=1)

| Coluna | Tipo | Preench. SDR | % SDR | Papel no Funil | Criticidade |
|--------|------|-------------|-------|---------------|-------------|
| `motivos_qualificacao_sdr` | TEXT | 117 | 2,8% | Filtro de deals de treinamento (`TRAINING_MOTIVE`) | **Crítico** |
| `data_reuniao_1` | TIMESTAMPTZ | 1.216 | 28,8% | **Agendamento**: ≠ null → deal agendou 1ª reunião | **Crítico** |
| `como_reuniao_1` | TEXT | 1.718 | 7,2% global | **Comparecimento**: ≠ null → reunião realizada | **Crítico** |
| `qualificado_sql` | BOOLEAN | 23.008 | 96,7% global | **Qualificação**: true → SQL qualificado | **Crítico** |
| `data_qualificado` | TIMESTAMPTZ | 80 (SDR) | 1,9% | Data da qualificação (timeline) | Auxiliar |
| `ww_fonte_do_lead` | TEXT | 954 | 22,6% | Fonte do lead (Leadster, Google, etc.) | Auxiliar |

### Taxas derivadas (calculadas em metrics-sdr.ts)

| Taxa | Fórmula | Campos envolvidos |
|------|---------|------------------|
| Taxa de Agendamento | deals com `data_reuniao_1` / total MQL | `data_reuniao_1`, `created_at` |
| Taxa de Comparecimento | deals com `como_reuniao_1` / deals agendados | `como_reuniao_1`, `data_reuniao_1` |
| Taxa de Qualificação | deals com `qualificado_sql=true` / reuniões realizadas | `qualificado_sql`, `como_reuniao_1` |
| Taxa de Perda SDR | deals `status=Lost` / total período | `status`, `created_at` |

---

## 5. MÉTRICAS DE FUNIL CLOSER

> Campos que alimentam o funil de Closer: Agendamento Closer → Reunião → Proposta → Ganho.
>
> **Contexto**: Closer Weddings = 543 deals (group_id=3)

| Coluna | Tipo | Preench. Closer | % Closer | Papel no Funil | Criticidade |
|--------|------|----------------|----------|---------------|-------------|
| `data_closer` | TIMESTAMPTZ | 521 | 95,9% | **Agendamento Closer**: data da reunião com closer | **Crítico** |
| `tipo_da_reuni_o_com_a_closer` | TEXT | 472 | 86,9% | Tipo de reunião (presencial/video) | Importante |
| `ww_closer_motivo_de_perda` | TEXT | 497 | 91,5% | **Motivo de perda específico do closer** | **Crítico** |
| `data_fechamento` | TIMESTAMPTZ | 2 | 0,4% | **Ganho**: data do fechamento do contrato | **Crítico** |
| `valor_fechado_em_contrato` | DECIMAL | 262 | 48,3% | Valor do contrato fechado | **Crítico** |
| `reuniao_closer` | TEXT | 141 | 0,6% | Como foi a reunião closer | Auxiliar |
| `ww_fez_segunda_reuni_o` | BOOLEAN | 26 | 0,1% | Fez 2ª reunião (lead score) | Auxiliar |
| `ww_foi_apresentado_detalhamento_de_or_amento` | BOOLEAN | 29 | 0,1% | Orçamento apresentado (lead score) | Auxiliar |

### Taxas derivadas (calculadas em metrics.ts)

| Taxa | Fórmula | Campos envolvidos |
|------|---------|------------------|
| Taxa de Conversão Closer | deals com `data_fechamento` / deals closer | `data_fechamento`, `group_id` |
| Ticket Médio | avg(`valor_fechado_em_contrato`) dos Won | `valor_fechado_em_contrato`, `data_fechamento` |
| Ticket por Convidado | `valor_fechado_em_contrato` / `num_convidados` | ambos |
| Tempo Médio de Fechamento | avg(dias entre `created_at` e `data_fechamento`) | ambos |

---

## 6. ANÁLISE DE PERDAS

> Campos que alimentam dashboards de motivos de perda e alertas.

| Coluna | Tipo | Preench. | % | Escopo | Usado para |
|--------|------|----------|---|--------|-----------|
| `motivo_de_perda` | TEXT | 4.860 | 20,4% | Global (AC field "Motivo de perda") | Análise geral de perda, motivos por período |
| `ww_closer_motivo_de_perda` | TEXT | 562 | 2,4% | Closer (AC field "[WW] [Closer] Motivo de Perda") | Perda específica do closer, alerta lead fake |
| `motivo_desqualifica_o_sdr` | TEXT | 106 | 0,4% | SDR (AC field "Motivo desqualificação SDR") | Desqualificação SDR |
| `motivo_perda` | TEXT | 620 | 2,6% | Legacy (migration 001, coluna original) | **Deprecated** — usar `motivo_de_perda` |
| `motivo_da_oportunidade_futura` | TEXT | 8 | 0,0% | Follow-up | Razão para retorno futuro |

---

## 7. LEAD SCORE E PERFIL

> Campos que alimentam o score simplificado e análise de perfil do lead.

| Coluna | Tipo | Preench. | % | Dimensão do Score | Peso |
|--------|------|----------|---|------------------|------|
| `destino` | TEXT | 6.466 | 27,2% | **Conversão por destino** | 1/3 |
| `num_convidados` | INTEGER | 6.337 | 26,6% | **Proximidade da mediana Won** | 1/3 |
| `orcamento` | DECIMAL | 5.865 | 24,7% | **Proximidade do ticket médio** | 1/3 |
| `status_do_relacionamento` | TEXT | 980 | 4,1% | Scoring categórico | Auxiliar |
| `costumam_viajar` | BOOLEAN | 896 | 3,8% | Scoring booleano | Auxiliar |
| `motivo_da_escolha_de_um_destination_wedding` | BOOLEAN | 984 | 4,1% | Scoring booleano | Auxiliar |
| `j_foi_em_algum_destination_wedding` | BOOLEAN | 901 | 3,8% | Scoring booleano | Auxiliar |
| `j_tem_destino_definido` | BOOLEAN | 1.074 | 4,5% | Scoring booleano | Auxiliar |
| `previs_o_contratar_assessoria` | TEXT | 613 | 2,6% | Scoring categórico | Auxiliar |
| `como_reuniao_1` | TEXT | 1.718 | 7,2% | Scoring categórico (modalidade) | Auxiliar |
| `tipo_da_reuni_o_com_a_closer` | TEXT | 762 | 3,2% | Scoring categórico | Auxiliar |
| `ww_fez_segunda_reuni_o` | BOOLEAN | 26 | 0,1% | Scoring booleano | Auxiliar |
| `ww_foi_apresentado_detalhamento_de_or_amento` | BOOLEAN | 29 | 0,1% | Scoring booleano | Auxiliar |
| `is_elopement` | BOOLEAN | 23.788 | 100% | Pipeline (Elopment vs Wedding) | Auxiliar |

---

## 8. CAMPOS OPERACIONAIS (NÃO USADOS NO DASHBOARD)

> 97 colunas existem no banco mas não são consultadas pelo kpi-weddings.
> Podem ser úteis para futuros dashboards ou relatórios.

### Weddings — Planejamento e Operação

| Coluna | Preench. | Descrição |
|--------|----------|-----------|
| `nome_do_casal` | 1,0% | Nome do casal |
| `nome_noivo` | 0,6% | Nome do noivo(a) |
| `cpf_contato_principal` | 3,1% | CPF principal |
| `telefone` | 18,7% | Telefone |
| `cidade` | 4,8% | Cidade do lead |
| `ww_link_do_proposeful` | 3,0% | Link da proposta |
| `ww_link_reuni_o_teams_sdr` | 0,7% | Link Teams SDR |
| `ww_link_reuni_o_teams_closer` | 0,6% | Link Teams Closer |
| `flexibilidade_de_destino` | 0,1% | Flexibilidade de destino |
| `previs_o_data_de_casamento` | 0,1% | Previsão data casamento |
| `data_confirmada_do_casamento` | — | Data confirmada casamento |
| `local_do_casamento` | — | Local do casamento |
| `nome_do_casamento` | — | Nome do casamento |
| `hospedagem` | — | Hospedagem |
| `operadora_de_bloqueio` | — | Operadora de bloqueio |
| `cerimonial_incluso_quantos` | — | Cerimonial incluso |

### Trips — Welcome Trips

| Coluna | Descrição |
|--------|-----------|
| `wt_destino` | Destino Trips |
| `wt_planos` | Planos Trips |
| `wt_investimento_por_pessoa` | Investimento por pessoa |
| `sdr_wt_motivo_de_perda` | Motivo de perda SDR Trips |
| `vnd_wt_motivo_de_perda` | Motivo de perda Vendedor Trips |
| `vnd_wt_qual_valor_da_venda` | Valor da venda Trips |
| `sdr_wt_data_fechamento_taxa` | **(NOVO 30/abr/2026)** Data em que a taxa do Trips foi paga. AC field id 332 ("SDR WT - Data Fechamento Taxa"). Usado pelo endpoint `/api/board/weekly` (kpi-weddings) como âncora temporal de `funnel.weekly.vendas` (WT). Só deals criados a partir de 30/abr/2026 são populados; histórico anterior requer `scripts/reprocess-raw-data.mjs`. Mapeado em `_shared/field-maps.ts` (FIELD_MAP, FIELD_KEY_MAP, DATE_COLS). |
| `pagamento_de_taxa` | Status textual do pagamento da taxa Trips. Usado em conjunto com `pagou_a_taxa` como sinal de "taxa paga" (parity com `lib/supabase-api.ts:168` no kpi-weddings: `pagamento_de_taxa OR pagou_a_taxa`). |
| `pagou_a_taxa` | Status textual alternativo. Mesma semântica que `pagamento_de_taxa`; legacy fallback. |

### Convidados (BWW)

| Coluna | Descrição |
|--------|-----------|
| `bww_convidado_*` (7 colunas) | Dados de convidados individuais |
| `codigo_do_casamento_deal` | Código do casamento |
| `mensagem_do_convidado` | Mensagem do convidado |

### WelConnect (WC)

| Coluna | Descrição |
|--------|-----------|
| `wc_agendamento_de_reuni_o` | Agendamento WC |
| `wc_como_foi_feita_a_reuni_o` | Reunião WC |
| `wc_motivo_de_perda` | Motivo de perda WC |
| `wc_data_e_hora_do_ganho` | Data do ganho WC |

---

## 9. TABELA `monthly_targets` — Metas Mensais

| Coluna | Tipo SQL | Descrição |
|--------|----------|-----------|
| `id` | SERIAL PK | ID auto-incremental |
| `month` | DATE NOT NULL | Mês da meta (primeiro dia) |
| `pipeline_type` | TEXT NOT NULL | `'wedding'`, `'elopement'` ou `'trips'` |
| `leads` | INTEGER | Meta de leads |
| `mql` | INTEGER | Meta de MQLs |
| `agendamento` | INTEGER | Meta de agendamentos |
| `reunioes` | INTEGER | Meta de reuniões realizadas |
| `qualificado` | INTEGER | Meta de qualificados |
| `closer_agendada` | INTEGER | Meta de closers agendadas |
| `closer_realizada` | INTEGER | Meta de closers realizadas |
| `vendas` | INTEGER | Meta de vendas/ganhos |
| `cpl` | DECIMAL(10,2) | Custo por lead |

**Constraint**: UNIQUE(`month`, `pipeline_type`)

---

## 9.5. TABELA `board_audit_log` — Auditoria do endpoint `/api/board/weekly`

> **Criada em 30/abr/2026** via migration `20260430_board_endpoint.sql`.
> Cada chamada ao endpoint do Board (kpi-weddings) gera uma linha (fire-and-forget).

| Coluna | Tipo SQL | Descrição |
|--------|----------|-----------|
| `id` | BIGSERIAL | PK |
| `called_at` | TIMESTAMPTZ | Default `NOW()`. Indexed DESC. |
| `brand` | TEXT | `'ww'` ou `'wt'` (CHECK constraint) |
| `period_start` | DATE | `start` da query |
| `period_end` | DATE | `end` da query |
| `status_code` | INTEGER | HTTP retornado (200, 401, 422, 503, 500…) |
| `error_code` | TEXT | NULL em sucesso; em erro: `UNAUTHORIZED`, `INVALID_RANGE`, `DATA_STALE`, etc. |
| `latency_ms` | INTEGER | Duração total do handler |
| `client_ip` | INET | Primeiro hop de `x-forwarded-for` (Vercel) |
| `user_agent` | TEXT | Header `User-Agent` |

**Indexes**: `idx_board_audit_called_at` (DESC), `idx_board_audit_brand_period` (brand, period_start).

**RLS**: enabled. Apenas `service_role` pode INSERT/SELECT (anon não vê).

**Cleanup**: pg_cron job `board_audit_log_cleanup` roda dia 1 do mês às 03:00 UTC, deleta linhas com `called_at < NOW() - INTERVAL '12 months'`.

**Queries úteis:**

```sql
-- Últimas chamadas (debug)
SELECT called_at AT TIME ZONE 'America/Sao_Paulo' AS hora_brt, brand, period_start, status_code, error_code, latency_ms
FROM board_audit_log
ORDER BY called_at DESC
LIMIT 20;

-- Health do endpoint na última semana
SELECT brand, status_code, COUNT(*), AVG(latency_ms)::int AS avg_latency_ms
FROM board_audit_log
WHERE called_at > NOW() - INTERVAL '7 days'
GROUP BY brand, status_code
ORDER BY brand, status_code;

-- Erros recentes
SELECT called_at AT TIME ZONE 'America/Sao_Paulo' AS hora_brt, brand, period_start, period_end, status_code, error_code
FROM board_audit_log
WHERE status_code >= 400
ORDER BY called_at DESC
LIMIT 50;
```

---

## 10. FLUXO DE DADOS: AC → Supabase → Dashboard

```
ActiveCampaign
    │
    ├── Webhook (real-time)
    │   └── Edge Function: activecampaign-webhook
    │       ├── Mapeia por FIELD_KEY_MAP (key/nome → coluna)
    │       ├── Coerção: DATE_COLS, NUM_COLS, CONV_MAP, ORC_MAP, DESTINO_NORM
    │       └── Upsert na tabela deals
    │
    ├── Sync (pg_cron cada 2h, janela 3h)
    │   └── Edge Function: sync-deals
    │       ├── Mapeia por FIELD_MAP (ID → coluna)
    │       ├── Mesma coerção (importa de _shared)
    │       └── Upsert na tabela deals
    │
    └── Reprocessamento (manual)
        └── Script: reprocess-raw-data.mjs
            ├── Lê raw_data de cada deal
            ├── Mapeia por FIELD_KEY_MAP
            └── Upsert na tabela deals

Supabase (deals)
    │
    └── kpi-weddings Dashboard
        ├── SELECT de 44 colunas (DEAL_COLUMNS)
        ├── mapRowToWonDeal() → objeto tipado
        ├── Motores de cálculo (métricas, funil, score)
        └── Componentes React (gráficos, KPIs, tabelas)
```

---

## 11. CAMPOS COM PROBLEMAS CONHECIDOS

| Coluna | Problema | Impacto |
|--------|---------|---------|
| `pipeline_id` | 0% preenchido | funnel-utils tenta usar, fallback em pipeline name |
| `ww_como_foi_feita_reuni_o_closer` | 0% preenchido | Dashboard lê com fallback para `tipo_da_reuni_o_com_a_closer` |
| `lead_score_2` | 0% preenchido | Campo AC não populado |
| `motivo_perda` | 2,6% (legacy) | Coluna da migration 001, **deprecated** — usar `motivo_de_perda` (20,4%) |
| `data_fechamento` | 0,6% global / 0,4% closer | **Esperado baixo** — só deals Won têm esta data |

---

## 12. GLOSSÁRIO

| Termo | Definição |
|-------|-----------|
| **MQL** | Marketing Qualified Lead — lead que passou pela triagem inicial |
| **SQL** | Sales Qualified Lead — lead qualificado para venda (`qualificado_sql=true`) |
| **SDR** | Sales Development Representative — pipeline de prospecção (group_id=1) |
| **Closer** | Pipeline de fechamento (group_id=3) |
| **Won** | Deal ganho (`data_fechamento ≠ null`, **não** pelo campo `status`) |
| **Lost** | Deal perdido (`status = 'Lost'` e `data_fechamento = null`) |
| **Elopment** | Casamento íntimo (pipeline "Elopment Wedding", is_elopement=true) |
| **DW** | Destination Wedding |
| **CONV_MAP** | Mapa de conversão: texto de faixa → número mediano de convidados |
| **ORC_MAP** | Mapa de orçamento: texto de faixa → valor numérico médio |
| **DESTINO_NORM** | Normalização de destinos (ex: "itália" → "Itália") |
