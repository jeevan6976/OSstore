-- Migration: Add app-store columns to tools table
-- Run this after deploying the new code:
--   docker exec -i osstore-postgres-1 psql -U osstore -d osstore < migrations/001_add_app_columns.sql

ALTER TABLE tools ADD COLUMN IF NOT EXISTS package_name VARCHAR(512);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS apk_url VARCHAR(2048);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS download_url VARCHAR(2048);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS app_type VARCHAR(32);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS icon_url VARCHAR(2048);
ALTER TABLE tools ADD COLUMN IF NOT EXISTS latest_version VARCHAR(128);

CREATE INDEX IF NOT EXISTS ix_tools_package_name ON tools(package_name);
CREATE INDEX IF NOT EXISTS ix_tools_app_type ON tools(app_type);

-- Set default app_type for existing GitHub tools
UPDATE tools SET app_type = 'tool' WHERE app_type IS NULL AND source = 'github';
