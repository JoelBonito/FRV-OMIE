-- =============================================================
-- Migration: pg_cron scheduled sync every 6 hours
-- Uses pg_net to call omie-sync Edge Function via HTTP POST
--
-- REQUIREMENTS:
--   1. Supabase Pro+ plan (pg_cron + pg_net extensions)
--   2. Set database config variables BEFORE running this migration:
--
--      ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<project>.supabase.co';
--      ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
--
--   3. Edge Functions deployed: omie-sync
-- =============================================================

-- Safely enable extensions (will fail gracefully on free tier)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  RAISE NOTICE 'pg_cron enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available (requires Supabase Pro+)';
END;
$$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
  RAISE NOTICE 'pg_net enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_net not available (requires Supabase Pro+)';
END;
$$;

-- Helper function to trigger sync via HTTP
-- Can be called by pg_cron or manually: SELECT frv_omie.trigger_scheduled_sync();
CREATE OR REPLACE FUNCTION frv_omie.trigger_scheduled_sync()
RETURNS void AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  -- Read config from database settings
  v_url := current_setting('app.settings.supabase_url', true);
  v_key := current_setting('app.settings.service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'Missing app.settings.supabase_url or service_role_key. Skipping sync.';
    RETURN;
  END IF;

  -- Call omie-sync Edge Function via pg_net
  PERFORM net.http_post(
    url := v_url || '/functions/v1/omie-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{"type": "full", "maxPages": 50}'::jsonb
  );

  -- Log the scheduled trigger
  INSERT INTO frv_omie.sync_logs (tipo, endpoint, call_method, status, duracao_ms)
  VALUES ('scheduled', '/functions/v1/omie-sync', 'pg_cron', 'success', 0);

EXCEPTION WHEN OTHERS THEN
  INSERT INTO frv_omie.sync_logs (tipo, endpoint, call_method, status, erros, duracao_ms)
  VALUES ('scheduled', '/functions/v1/omie-sync', 'pg_cron', 'error',
    jsonb_build_object('message', SQLERRM), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cron job (only if pg_cron is available)
DO $$
BEGIN
  PERFORM cron.schedule(
    'omie-sync-6h',
    '0 */6 * * *',
    $job$ SELECT frv_omie.trigger_scheduled_sync(); $job$
  );
  RAISE NOTICE 'Cron job omie-sync-6h scheduled (every 6 hours)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$$;
