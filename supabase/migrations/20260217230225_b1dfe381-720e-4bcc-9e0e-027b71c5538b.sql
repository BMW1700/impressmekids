-- Drop the overly permissive "System can insert questions" policy
-- Proper teacher-scoped insert policies already exist (q_insert, Teachers can insert questions in their classrooms)
DROP POLICY IF EXISTS "System can insert questions" ON public.questions;
