SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue'),
  schedule := '30 seconds'
);