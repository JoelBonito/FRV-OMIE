-- Secure RPC for credential management (admin-only)
-- Replaces direct table access with auditable function calls

-- Function: update_omie_credentials
-- Only admin users can update API credentials
CREATE OR REPLACE FUNCTION frv_omie.update_omie_credentials(
  p_app_key TEXT,
  p_app_secret TEXT,
  p_webhook_secret TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = frv_omie
AS $$
BEGIN
  -- Verify caller is admin
  IF (SELECT (auth.jwt() -> 'user_metadata' ->> 'user_role')) != 'admin' THEN
    RAISE EXCEPTION 'Only admin can update credentials';
  END IF;

  UPDATE frv_omie.config_omie
  SET app_key = p_app_key,
      app_secret = p_app_secret,
      webhook_secret = COALESCE(p_webhook_secret, webhook_secret);
END;
$$;

GRANT EXECUTE ON FUNCTION frv_omie.update_omie_credentials(TEXT, TEXT, TEXT) TO authenticated;


-- Function: generate_webhook_secret
-- Generates a cryptographically random 32-char base64 token
CREATE OR REPLACE FUNCTION frv_omie.generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = frv_omie
AS $$
BEGIN
  RETURN encode(gen_random_bytes(24), 'base64');
END;
$$;

GRANT EXECUTE ON FUNCTION frv_omie.generate_webhook_secret() TO authenticated;


-- Update safe view to expose webhook_secret status
CREATE OR REPLACE VIEW frv_omie.config_omie_safe AS
SELECT
  id,
  sync_interval_hours,
  status_sync,
  ultimo_sync,
  (app_key IS NOT NULL AND app_key != '') AS has_credentials,
  (webhook_secret IS NOT NULL AND webhook_secret != '') AS has_webhook_secret
FROM frv_omie.config_omie;
