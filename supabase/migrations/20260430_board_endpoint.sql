-- ============================================
-- Board endpoint — schema bootstrap
-- Adds: WT taxa close date column + indices + audit log + cleanup cron
-- See: kpi-weddings/docs/board-api-briefing.md (v1.2)
-- ============================================

-- 1. New WT column for taxa close date
-- Field map entry needs to be added to _shared/field-maps.ts:
--   FIELD_MAP[<id>] = 'sdr_wt_data_fechamento_taxa'
--   FIELD_KEY_MAP['SDR WT - Data Fechamento Taxa'] = 'sdr_wt_data_fechamento_taxa'
--   DATE_COLS includes 'sdr_wt_data_fechamento_taxa'
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS sdr_wt_data_fechamento_taxa TIMESTAMPTZ;

-- 2. Performance indices on event date columns
CREATE INDEX IF NOT EXISTS idx_deals_data_qualificado
  ON deals(data_qualificado)
  WHERE data_qualificado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_data_closer
  ON deals(data_closer)
  WHERE data_closer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_data_fechamento
  ON deals(data_fechamento)
  WHERE data_fechamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_sdr_wt_data_fechamento_taxa
  ON deals(sdr_wt_data_fechamento_taxa)
  WHERE sdr_wt_data_fechamento_taxa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deals_pipeline_created
  ON deals(pipeline, created_at);

-- 3. board_audit_log table
CREATE TABLE IF NOT EXISTS board_audit_log (
  id            BIGSERIAL PRIMARY KEY,
  called_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  brand         TEXT        NOT NULL CHECK (brand IN ('ww', 'wt')),
  period_start  DATE        NOT NULL,
  period_end    DATE        NOT NULL,
  status_code   INTEGER     NOT NULL,
  error_code    TEXT,
  latency_ms    INTEGER     NOT NULL,
  client_ip     INET,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_board_audit_called_at
  ON board_audit_log(called_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_audit_brand_period
  ON board_audit_log(brand, period_start);

-- RLS: only service_role writes; anon read is denied (audit log is internal)
ALTER TABLE board_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role writes board_audit_log" ON board_audit_log;
CREATE POLICY "service_role writes board_audit_log" ON board_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Cleanup cron: delete entries older than 12 months, runs monthly
-- Requires pg_cron extension (already in use for sync-deals)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('board_audit_log_cleanup')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'board_audit_log_cleanup');

    PERFORM cron.schedule(
      'board_audit_log_cleanup',
      '0 3 1 * *',
      $cleanup$DELETE FROM board_audit_log WHERE called_at < NOW() - INTERVAL '12 months'$cleanup$
    );
  END IF;
END $$;
