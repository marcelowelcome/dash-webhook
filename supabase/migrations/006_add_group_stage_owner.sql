-- Migration: Add group_id, stage_id, and owner_id columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS group_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS owner_id TEXT;
