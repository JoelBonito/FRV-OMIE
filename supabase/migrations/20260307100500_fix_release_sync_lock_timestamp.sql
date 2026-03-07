-- =============================================================
-- Fix: update ultimo_sync on success status (not just idle)
-- Previously only p_status='idle' triggered the timestamp update,
-- but we now use p_status='success' after successful sync.
-- =============================================================

CREATE OR REPLACE FUNCTION frv_omie.release_sync_lock(p_status TEXT DEFAULT 'idle')
RETURNS void AS $$
BEGIN
  UPDATE frv_omie.config_omie
  SET status_sync = p_status,
      ultimo_sync = CASE WHEN p_status IN ('idle', 'success') THEN now() ELSE ultimo_sync END
  WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
