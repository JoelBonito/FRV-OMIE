-- =============================================================
-- Fix: Add WHERE clause to sync lock functions
-- Supabase enables safeupdate extension which blocks UPDATE without WHERE
-- =============================================================

CREATE OR REPLACE FUNCTION frv_omie.acquire_sync_lock()
RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
  v_status TEXT;
  v_ultimo TIMESTAMPTZ;
BEGIN
  SELECT id, status_sync, ultimo_sync INTO v_id, v_status, v_ultimo
  FROM frv_omie.config_omie
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_status = 'running' AND v_ultimo > now() - interval '10 minutes' THEN
    RETURN FALSE;
  END IF;

  UPDATE frv_omie.config_omie SET status_sync = 'running' WHERE id = v_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION frv_omie.release_sync_lock(p_status TEXT DEFAULT 'idle')
RETURNS void AS $$
BEGIN
  UPDATE frv_omie.config_omie
  SET status_sync = p_status,
      ultimo_sync = CASE WHEN p_status = 'idle' THEN now() ELSE ultimo_sync END
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
