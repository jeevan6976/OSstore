-- Add maturity_score column to trust_scores table
-- Safe to run multiple times (IF NOT EXISTS)
ALTER TABLE trust_scores ADD COLUMN IF NOT EXISTS maturity_score FLOAT DEFAULT 0.0;
