# pg_cron Sync Setup

## Pre-requisites
- Supabase **Pro plan** or higher (pg_cron + pg_net extensions)
- Edge Functions deployed (`omie-sync`)

## Option A: Via Supabase SQL Editor (recommended)

Run this SQL replacing `<YOUR_PROJECT_REF>` and `<YOUR_SERVICE_ROLE_KEY>`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'omie-sync-6h',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/omie-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
    body := '{"type": "full", "maxPages": 50}'::jsonb
  );
  $$
);
```

## Option B: Via migration file

The migration file `20260223170000_pg_cron_sync.sql` uses `current_setting()` to read
Supabase app settings. These are automatically set in hosted Supabase environments.

## Managing the job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View recent job runs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Unschedule
SELECT cron.unschedule('omie-sync-6h');

-- Change interval to every 3 hours
SELECT cron.schedule('omie-sync-6h', '0 */3 * * *', $$ ... $$);
```
