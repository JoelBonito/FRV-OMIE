-- =============================================================
-- Migration: Insert Omie API credentials
-- =============================================================

-- Insert config (only if empty)
INSERT INTO frv_omie.config_omie (app_key, app_secret, sync_interval_hours, status_sync)
SELECT '4653156013506', '5f0de2d27c946a027a0192b80acd7777', 6, 'idle'
WHERE NOT EXISTS (SELECT 1 FROM frv_omie.config_omie LIMIT 1);
