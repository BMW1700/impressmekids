-- Remove the overly permissive "System can manage error patterns" policy
-- The table already has proper student and teacher policies in place
DROP POLICY IF EXISTS "System can manage error patterns" ON public.student_error_patterns;