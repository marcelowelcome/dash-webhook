-- ============================================
-- Fix ads_spend_cache pipeline constraint
-- Allow null values (single account for all pipelines)
-- ============================================

-- Remove the old CHECK constraint
ALTER TABLE ads_spend_cache DROP CONSTRAINT IF EXISTS ads_spend_cache_pipeline_check;

-- Pipeline can now be null or any text value
-- No constraint needed since we're using a single account

-- Clean up old data with pipeline values (optional)
-- UPDATE ads_spend_cache SET pipeline = null WHERE pipeline IS NOT NULL;
