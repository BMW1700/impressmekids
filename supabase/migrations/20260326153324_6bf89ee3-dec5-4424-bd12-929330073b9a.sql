
-- Migration 2: Fix system table INSERT policies (batch)
-- These tables are populated by triggers and SECURITY DEFINER functions, not direct user inserts

-- student_behavior_stats: populated by update_behavior_stats() trigger
DROP POLICY IF EXISTS "System can insert stats" ON public.student_behavior_stats;
DROP POLICY IF EXISTS "System can insert behavior stats" ON public.student_behavior_stats;
CREATE POLICY "Service role can insert behavior stats"
ON public.student_behavior_stats
FOR INSERT
TO service_role
WITH CHECK (true);

-- risk_alert_notifications: populated by system/edge functions
DROP POLICY IF EXISTS "System can insert notifications" ON public.risk_alert_notifications;
DROP POLICY IF EXISTS "System can insert risk notifications" ON public.risk_alert_notifications;
CREATE POLICY "Service role can insert risk notifications"
ON public.risk_alert_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- student_risk_history: populated by system/edge functions
DROP POLICY IF EXISTS "System can insert risk history" ON public.student_risk_history;
CREATE POLICY "Service role can insert risk history"
ON public.student_risk_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- practice_exercises: populated by system/edge functions
DROP POLICY IF EXISTS "System can create exercises" ON public.practice_exercises;
DROP POLICY IF EXISTS "System can insert exercises" ON public.practice_exercises;
CREATE POLICY "Service role can insert exercises"
ON public.practice_exercises
FOR INSERT
TO service_role
WITH CHECK (true);
