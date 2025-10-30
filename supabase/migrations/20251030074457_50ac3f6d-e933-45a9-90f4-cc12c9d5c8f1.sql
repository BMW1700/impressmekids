-- Fix the daily backup cron job to work without authentication header
-- Drop the existing cron job
SELECT cron.unschedule('daily-cold-storage-backup');

-- Recreate the cron job without Authorization header
SELECT cron.schedule(
  'daily-cold-storage-backup',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/create-cold-storage-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);