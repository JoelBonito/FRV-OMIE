-- Remove hardcoded credentials from initial seed migration
-- Credentials must be set via RPC update_omie_credentials (admin-only)
UPDATE frv_omie.config_omie
SET app_key = '',
    app_secret = '',
    webhook_secret = NULL;
