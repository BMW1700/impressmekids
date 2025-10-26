-- Create automated daily cleanup cron job (runs at 3 AM UTC daily, 1 hour after backup)
SELECT cron.schedule(
  'daily-backup-cleanup',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/cleanup-old-backups',
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
    'job_name', 'daily-backup-cleanup',
    'schedule', '0 3 * * *',
    'description', 'Automated daily cleanup of backups older than 90 days at 3 AM UTC'
  )
);