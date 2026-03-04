-- =============================================================
-- Migration: Create safe view for config_omie (no secrets)
-- Replaces direct frontend access to config_omie table
-- =============================================================

-- Drop the pending gerente policy if it exists
DROP POLICY IF EXISTS config_gerente_read ON frv_omie.config_omie;

-- Create safe view that never exposes secrets
CREATE OR REPLACE VIEW frv_omie.config_omie_safe AS
SELECT
  id,
  sync_interval_hours,
  status_sync,
  ultimo_sync,
  (app_key IS NOT NULL AND app_key != '') AS has_credentials
FROM frv_omie.config_omie;

COMMENT ON VIEW frv_omie.config_omie_safe IS 'Safe view of config_omie without API secrets. Used by frontend.';

-- Grant access to authenticated users (admin + gerente + vendedor can read sync status)
GRANT SELECT ON frv_omie.config_omie_safe TO authenticated;
