-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create automated daily backup cron job (runs at 2 AM UTC daily)
SELECT cron.schedule(
  'daily-cold-storage-backup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/create-cold-storage-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Log the cron job creation
INSERT INTO public.backup_audit_log (
  action_type,
  status,
  action_details
) VALUES (
  'cron_job_created',
  'success',
  jsonb_build_object(
    'job_name', 'daily-cold-storage-backup',
    'schedule', '0 2 * * *',
    'description', 'Automated daily backup at 2 AM UTC'
  )
);