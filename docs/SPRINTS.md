# Plano de Sprints — dash-webhook

Criado em 2026-04-15, após revisão técnica e remediação P0–P8
(ver `/home/marcelo/.claude/plans/floofy-wandering-origami.md`).

Cada sprint = ~1 semana de trabalho focado. Tempo estimado em horas para
priorização; ajustar conforme disponibilidade. Itens marcados **[BLOQUEADOR]**
impedem deploy ou uso do sistema.

**Atualização 2026-05-04:** Sprint 1 parcialmente concluída; descoberta-chave da Sprint 1 invalidou item 2 (CRON_SECRET nas rotas Next.js — irrelevante porque o dash-webhook **não roda como Next.js em produção**, apenas como Edge Functions no Supabase). Sprint INTERIM (não planejada) entregou o Board Executivo endpoint v1 — ver kpi-weddings/ROADMAP.md.

---

## ✅ Sprint 1 — Deploy desbloqueado (parcial — 30/abr a 4/mai)

Objetivo: destravar o build do Next.js e aplicar em produção as mudanças
P0–P8 já prontas. Saída: deploy limpo com RLS e observabilidade novos.

### Tarefas

1. **[BLOQUEADOR] Corrigir chamadas de `fetchMetaAdsSpend`/`fetchGoogleAdsSpend`** — 1h ✅
   - **Concluído em 2026-04-30, commit `4d09807`.** Solução **invertida** vs plano: em vez de propagar `pipeline=viewType` para os call sites, alinhamos `fetchGoogleAdsSpend` ao padrão `pipeline='wedding'` e o cron writer (`refresh/route.ts`) para gravar a mesma constante. Motivo: validação SQL revelou que a `ads_spend_cache` em prod já tinha 38+29 linhas com `pipeline='wedding'`; a proposta original (`.is(null)`) zeraria o dashboard.
   - **Fix lateral:** `fetchGoogleAdsSpend` estava lendo `.is('pipeline', null)` enquanto os dados eram `pipeline='wedding'` — Google Ads exibia R$ 0 silencioso há 20+ dias. Resolvido junto.
   - Critério: ✅ `next build` verde.

2. **~~[BLOQUEADOR] Configurar secrets no Vercel/Supabase~~** — **OBSOLETO**
   - **Conclusão 2026-04-30:** o dash-webhook **não roda como Next.js em produção** (descoberto sondando `dash-webhook.vercel.app`, `ww-dash.vercel.app` — todos zumbi com middleware redirecionando tudo para `/login`).
   - O cron real é o `pg_cron` do Supabase chamando a Edge Function `sync-deals` diretamente, sem passar por rotas Next.
   - `CRON_SECRET` nas rotas Next.js → não usadas em prod. Setá-lo no Vercel zumbi não faz nada útil.
   - `SYNC_SECRET` no kpi-weddings → ainda relevante, mas é rota daquele projeto (mover para o ROADMAP do kpi-weddings).
   - `SLACK_WEBHOOK_URL` → permanece desejável; mover para Sprint 3 (Observabilidade).

3. **Aplicar migrations novas em staging** — 1h
   - **Status parcial em 2026-05-04:**
     - `20260416_create_sync_logs.sql` ✅ aplicada em prod (sync_logs populando, board endpoint usa).
     - `20260416_tighten_rls.sql` ❌ **ainda não aplicada** — RLS continua "Allow all access" em deals/monthly_targets/ads_spend_cache. Dívida de segurança movida para Sprint 4.
     - **Bonus:** `20260430_board_endpoint.sql` aplicada em 2026-04-30 (cria col `sdr_wt_data_fechamento_taxa`, índices, `board_audit_log`).
   - Critério ajustado: dashboard segue funcionando sem erros de RLS (verdade hoje, mas porque RLS está aberto; aperto fica para Sprint 4).

4. **Deploy de produção** — 30min ✅
   - Edge Functions `sync-deals` + `activecampaign-webhook` re-deployadas em 2026-05-04 via `supabase functions deploy` com `_shared/field-maps.ts` atualizado (incluindo field 332 → `sdr_wt_data_fechamento_taxa`).
   - **Pendência git:** o `_shared/` continua untracked apesar de já estar em produção via CLI. Coordenar com PaNdassauro para limpar.
   - Critério: ✅ Edge Functions servindo sem 500. `sync_logs` populando ~84/semana (cron 2h × 7d).

**Status:** ~80% concluída. Item 2 obsoleto; item 3 metade aplicada (sync_logs sim, tighten_rls não). Items 1 e 4 fechados.

---

## Sprint 2 — Qualidade de dados (semana de 27/abr/2026)

Objetivo: resolver a dívida BOOLEAN + ajustes em índices que afetam
performance de dashboard. Mais arriscado — precisa janela de deploy.

### Tarefas

1. **Índices compostos no `deals`** — 2h
   - `CREATE INDEX idx_deals_group_status_created ON deals(group_id, status, created_at)`
   - `CREATE INDEX idx_deals_data_fechamento ON deals(data_fechamento) WHERE data_fechamento IS NOT NULL`
   - `CREATE INDEX idx_deals_updated_at ON deals(updated_at)` (já listado em MEMORY.md como pendente)
   - Critério: `EXPLAIN ANALYZE` das queries mais lentas do dashboard mostra
     `Index Scan` nos novos índices.

2. **BOOLEAN mal-tipados em 005** — 6h
   - Colunas como `como_foi_feita_a_1_reuni_o`, `qual_o_nome...`,
     `quantas_pessoas_v_o...` declaradas BOOLEAN mas recebem strings.
   - Nova migration: `ALTER TABLE deals ALTER COLUMN x TYPE TEXT USING x::text`.
   - Remover essas colunas de `BOOL_COLS` em `ac-field-map.ts`.
   - Verificar se kpi-weddings usa alguma dessas em comparações booleanas.
   - Rodar `reprocess-raw-data.mjs` para repopular com tipos corretos.
   - Critério: queries em kpi-weddings não quebram; dados populados.

3. **Testes adicionais de `ac-field-map`** — 3h
   - Edge cases de `parseDate` (timezone BR, strings malformadas, ISO sem `T`).
   - `coerceFieldValue` para cada categoria (DATE, NUM, BOOL, default).
   - `resolveDestino` com fallback "Outro"→field 29.
   - Regressão para o fix do parseNumber BR (já adicionado).
   - Critério: cobertura >=80% em `ac-field-map.ts` + `_shared/field-maps.ts`.

**Total estimado: ~11h. Requer janela de deploy para BOOLEAN ALTER TYPE.**

---

## Sprint 3 — Observabilidade e resiliência (semana de 4/mai/2026)

Objetivo: transformar `sync_logs` em sinal acionável e resolver pendências
listadas em MEMORY.md.

### Tarefas

1. **Dashboard básico de `sync_logs`** — 3h
   - Widget em kpi-weddings: última sync, latência média, taxa de erro 7d.
   - Query: `SELECT date_trunc('day', finished_at), count(*), sum(synced),
     count(*) filter (where errors is not null) FROM sync_logs GROUP BY 1`.
   - Critério: operadora consegue ver falhas sem SSH no Supabase.

2. **Retenção de `sync_logs`** — 1h
   - pg_cron job diário: `DELETE FROM sync_logs WHERE finished_at < now() - interval '90 days'`.
   - Evita crescimento infinito (12 runs/dia × 90d = ~1080 linhas).

3. **Alertas Slack inteligentes** — 2h
   - Hoje envia só quando errors.length > 0 ou fail total.
   - Adicionar: alerta quando 3 syncs seguidos falharem (trend, não single).
   - Adicionar: alerta quando nenhum sync rodou nas últimas 4h (cron parado).

4. **Cache distribuído em /api/metrics** — 4h (kpi-weddings)
   - Cache atual é in-memory; perde em cada restart Vercel.
   - Migrar para Supabase KV ou Upstash Redis (TTL 5min como hoje).
   - Critério: dois cold-start consecutivos retornam o mesmo cached result.

5. **Atualizar docs desatualizados** — 2h
   - `DATA_DICTIONARY.md`, `FIELD_MAPPING.md` — rever contra `FIELD_KEY_MAP`
     atual (174 entries). Documentar campos 87→data_fechamento,
     ww_closer_data_hora_ganho (legacy), etc.

**Total estimado: ~12h.**

---

## Sprint 4 — Segurança avançada (semana de 11/mai/2026)

Objetivo: endurecer autenticação e preparar para usuários externos.

### Tarefas

1. **DASH_PASSWORD → session tokens** — 6h
   - Hoje `/api/auth/route.ts` compara password em plaintext e seta cookie.
   - Migrar: bcrypt hash + JWT assinado com segredo rotativo + TTL 24h + refresh.
   - Migration: adicionar `users` table ou usar Supabase Auth.
   - Critério: trocar senha não precisa redeploy; sessão expira; logout funcional.

2. **Rate limiting em rotas públicas** — 3h
   - Edge Function `activecampaign-webhook` aceita qualquer payload.
   - Adicionar validação de IP origem (AC publica range) ou shared secret header.
   - Vercel Edge Middleware para /api/* com rate-limit por IP.

3. **Auditoria de RLS** — 2h
   - Rodar `supabase db dump --schema public --role anon` para ver exatamente
     o que o anon consegue ler/fazer em produção.
   - Confirmar que 20260416_tighten_rls.sql cobriu todos os casos.

4. **Rotação de secrets** — 2h
   - Rotacionar AC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET.
   - Documentar procedimento em `docs/SECRETS_ROTATION.md`.

**Total estimado: ~13h.**

---

## Sprint 5 — Testes E2E e CI (semana de 18/mai/2026)

Objetivo: prevenir regressões como as que causaram o build quebrado (3 args
em fetchMetaAdsSpend) e validar fluxos completos.

### Tarefas

1. **Playwright E2E em kpi-weddings** — 8h
   - Smoke test: login → dashboard carrega → widgets renderizam → filtros mudam.
   - Happy path: cada aba (overview, SDR, closer, contracts) renderiza sem erro.
   - Critério: 5 testes verdes; CI bloqueia merge em caso de falha.

2. **GitHub Actions: typecheck + tests + build** — 2h
   - Hoje sem CI. Adicionar `.github/workflows/ci.yml`:
     - Matriz: dash-webhook, kpi-weddings.
     - Steps: install, typecheck, vitest, next build.
   - Critério: PR com tsc error não pode ser merged.

3. **Integration test: sync-deals local** — 3h
   - Usar `supabase functions serve` + mock AC API (MSW ou nock).
   - Verificar: upsert correto, window 3h, sync_logs persistido.

4. **Documentar runbook de incidente** — 2h
   - `docs/RUNBOOK.md`: como debugar cron falho, webhook 500, RLS bloqueando.

**Total estimado: ~15h.**

---

## Itens fora de sprint (backlog baixo)

- **Normalização de migrations 002_/006_** — só fazer se precisar reset de
  ambiente novo; renomear em prod causaria re-execução.
- **Renomear colunas portuguesas → snake_case ASCII** — refactor massivo
  (~44 colunas, 2 projetos). Só vale se houver dor real.
- **parseNumber com locale explícito** — já resolvido no P8.
- **Índice em `raw_data` (GIN)** — só se queries em campo customizado virarem
  hot path.
- **Dashboard `STATUS_MAP` dead code** — investigar e remover se confirmado.

---

## Cadência sugerida

- **Sexta:** review de sprint anterior + definir prioridades da próxima.
- **Segunda:** kick-off + alinhar bloqueadores.
- **Quarta:** check-in mid-sprint.
- Deploys ficam limitados a **terça/quarta** para evitar sexta-feira (6 de
  abril: merge freeze durante release mobile — ver MEMORY.md).

## Referências

- Relatório de revisão: `/home/marcelo/.claude/plans/floofy-wandering-origami.md`
- Memória do projeto: `/home/marcelo/.claude/projects/-home-marcelo-DashWW/memory/MEMORY.md`
- Pendências técnicas legadas: seção "Pendências para produção" do MEMORY.md
