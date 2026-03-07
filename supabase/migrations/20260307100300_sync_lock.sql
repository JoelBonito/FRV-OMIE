-- =============================================================
-- Migration: Server-side sync lock functions
-- Prevents concurrent sync operations across multiple clients
-- =============================================================

-- Acquire sync lock (returns true if acquired, false if already locked)
CREATE OR REPLACE FUNCTION frv_omie.acquire_sync_lock()
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_ultimo TIMESTAMPTZ;
BEGIN
  -- Check current status
  SELECT status_sync, ultimo_sync INTO v_status, v_ultimo
  FROM frv_omie.config_omie
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If couldn't get row lock, another sync is already running
  IF v_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- If already running and last update was < 10 minutes ago, refuse
  IF v_status = 'running' AND v_ultimo > now() - interval '10 minutes' THEN
    RETURN FALSE;
  END IF;

  -- Mark as running
  UPDATE frv_omie.config_omie SET status_sync = 'running';
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release sync lock
CREATE OR REPLACE FUNCTION frv_omie.release_sync_lock(p_status TEXT DEFAULT 'idle')
RETURNS void AS $$
BEGIN
  UPDATE frv_omie.config_omie
  SET status_sync = p_status,
      ultimo_sync = CASE WHEN p_status = 'idle' THEN now() ELSE ultimo_sync END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant to authenticated (Edge Functions use service_role, but these could be called from frontend too)
GRANT EXECUTE ON FUNCTION frv_omie.acquire_sync_lock() TO authenticated;
GRANT EXECUTE ON FUNCTION frv_omie.release_sync_lock(TEXT) TO authenticated;

COMMENT ON FUNCTION frv_omie.acquire_sync_lock() IS 'Acquires server-side sync lock. Returns FALSE if sync already running.';
COMMENT ON FUNCTION frv_omie.release_sync_lock(TEXT) IS 'Releases sync lock and optionally updates status.';
