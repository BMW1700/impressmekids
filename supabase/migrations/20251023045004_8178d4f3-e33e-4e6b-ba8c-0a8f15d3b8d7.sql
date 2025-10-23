-- Enable RLS on both tables
ALTER TABLE public.curriculum_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Teachers and admins can view curriculum anchors" ON public.curriculum_anchors;
DROP POLICY IF EXISTS "Service role can manage curriculum anchors" ON public.curriculum_anchors;
DROP POLICY IF EXISTS "Authenticated users can view curriculum anchors" ON public.curriculum_anchors;
DROP POLICY IF EXISTS "Teachers can view questions in their classrooms" ON public.questions;
DROP POLICY IF EXISTS "Teachers can insert questions in their classrooms" ON public.questions;
DROP POLICY IF EXISTS "Teachers can update questions in their classrooms" ON public.questions;
DROP POLICY IF EXISTS "Teachers can delete questions in their classrooms" ON public.questions;
DROP POLICY IF EXISTS "Teachers can update their own questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can delete their own questions" ON public.questions;
DROP POLICY IF EXISTS "Students can view questions in published assignments" ON public.questions;
DROP POLICY IF EXISTS "Service role can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can create questions in their classrooms" ON public.questions;

-- CURRICULUM_ANCHORS: Only teachers and admins (prevent IP theft)
CREATE POLICY "Teachers and admins can view curriculum anchors"
ON public.curriculum_anchors
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Service role can manage curriculum anchors"
ON public.curriculum_anchors
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- QUESTIONS: Prevent test leakage
-- Teachers can manage questions in their classrooms
CREATE POLICY "Teachers can view questions in their classrooms"
ON public.questions
FOR SELECT
USING (
  is_classroom_teacher(auth.uid(), classroom_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers can insert questions in their classrooms"
ON public.questions
FOR INSERT
WITH CHECK (
  is_classroom_teacher(auth.uid(), classroom_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers can update questions in their classrooms"
ON public.questions
FOR UPDATE
USING (
  is_classroom_teacher(auth.uid(), classroom_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers can delete questions in their classrooms"
ON public.questions
FOR DELETE
USING (
  is_classroom_teacher(auth.uid(), classroom_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Students: ONLY see questions in active tournament matches (NO test browsing)
CREATE POLICY "Students can view questions in active matches only"
ON public.questions
FOR SELECT
USING (
  -- Only questions that have been shown in their tournament matches
  id IN (
    SELECT me.question_id
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN tournament_players tp ON (tp.id = m.player_a OR tp.id = m.player_b)
    WHERE tp.profile_id = auth.uid()
    AND me.shown_at IS NOT NULL
  )
);

-- Service role can manage everything
CREATE POLICY "Service role can manage questions"
ON public.questions
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);