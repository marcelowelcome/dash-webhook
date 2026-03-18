-- Race condition fix: Only update a deal row if the incoming data is newer.
-- This prevents the 2h cron sync from overwriting fresher data written by the webhook.
--
-- Logic:
-- - On INSERT (new deal): allow unconditionally
-- - On UPDATE (existing deal): only apply if incoming updated_at >= stored updated_at
--   OR if the stored updated_at is NULL (legacy rows)
--
-- To apply: run via Supabase SQL editor or `supabase db push`

CREATE OR REPLACE FUNCTION deals_upsert_newer_only()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow if stored row has no updated_at (legacy data)
    IF OLD.updated_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Allow if incoming has no updated_at (webhook may not always set it)
    IF NEW.updated_at IS NULL THEN
        RETURN NEW;
    END IF;

    -- Only apply update if incoming data is same age or newer
    IF NEW.updated_at >= OLD.updated_at THEN
        RETURN NEW;
    END IF;

    -- Incoming data is older — skip update (keep existing row)
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS trg_deals_upsert_newer ON deals;

-- Create trigger: fires BEFORE UPDATE on each row
CREATE TRIGGER trg_deals_upsert_newer
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION deals_upsert_newer_only();

-- Verify
COMMENT ON TRIGGER trg_deals_upsert_newer ON deals IS
    'Race condition guard: rejects updates with older updated_at than the stored row';
