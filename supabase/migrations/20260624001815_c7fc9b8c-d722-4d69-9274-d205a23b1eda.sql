
-- Unschedule the weather-alerts cron (school-mode only, hits NOAA 96x/day)
DO $$
DECLARE
  job_id_to_unschedule bigint;
BEGIN
  SELECT jobid INTO job_id_to_unschedule
  FROM cron.job
  WHERE jobname = 'check-weather-alerts-every-15-min';

  IF job_id_to_unschedule IS NOT NULL THEN
    PERFORM cron.unschedule(job_id_to_unschedule);
  END IF;
END $$;

-- Drop the behavior-stats materialization trigger (fires on every behavior_records write)
DROP TRIGGER IF EXISTS update_behavior_stats_trigger ON public.behavior_records;
