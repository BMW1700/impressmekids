-- Fix the daily backup cleanup cron job to work without authentication header
-- Drop the existing cron job
SELECT cron.unschedule('daily-backup-cleanup');

-- Recreate the cron job without Authorization header
SELECT cron.schedule(
  'daily-backup-cleanup',
  '0 3 * * *', -- Every day at 3 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/cleanup-old-backups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);