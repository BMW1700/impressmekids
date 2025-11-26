-- Fix RLS policies for tournament_questions and question_groups
-- Use direct EXISTS subqueries instead of helper functions to avoid SET LOCAL issues

-- ============================================================
-- tournament_questions RLS policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage tournament questions" ON public.tournament_questions;
DROP POLICY IF EXISTS "Teachers can view tournament questions" ON public.tournament_questions;
DROP POLICY IF EXISTS "Tournament players can view questions" ON public.tournament_questions;

-- Teachers can SELECT tournament questions for their tournaments
CREATE POLICY "Teachers can view their tournament questions"
ON public.tournament_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
      AND c.teacher_id = auth.uid()
  )
);

-- Teachers can INSERT tournament questions for their tournaments
CREATE POLICY "Teachers can add questions to their tournaments"
ON public.tournament_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
      AND c.teacher_id = auth.uid()
  )
);

-- Teachers can DELETE tournament questions from their tournaments
CREATE POLICY "Teachers can remove questions from their tournaments"
ON public.tournament_questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tournaments t
    JOIN public.classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_questions.tournament_id
      AND c.teacher_id = auth.uid()
  )
);

-- Tournament players can view questions (for gameplay)
CREATE POLICY "Tournament players can view questions during gameplay"
ON public.tournament_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.tournament_players tp
    WHERE tp.tournament_id = tournament_questions.tournament_id
      AND tp.profile_id = auth.uid()
  )
);

-- ============================================================
-- question_groups RLS policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage their question groups" ON public.question_groups;
DROP POLICY IF EXISTS "Teachers can view their question groups" ON public.question_groups;

-- Teachers can SELECT question groups for their classrooms
CREATE POLICY "Teachers can view their classroom question groups"
ON public.question_groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = question_groups.classroom_id
      AND c.teacher_id = auth.uid()
  )
);

-- Teachers can INSERT question groups for their classrooms
CREATE POLICY "Teachers can create question groups in their classrooms"
ON public.question_groups
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = question_groups.classroom_id
      AND c.teacher_id = auth.uid()
  )
);

-- Teachers can UPDATE question groups for their classrooms
CREATE POLICY "Teachers can update their classroom question groups"
ON public.question_groups
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = question_groups.classroom_id
      AND c.teacher_id = auth.uid()
  )
);

-- Teachers can DELETE question groups for their classrooms
CREATE POLICY "Teachers can delete their classroom question groups"
ON public.question_groups
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = question_groups.classroom_id
      AND c.teacher_id = auth.uid()
  )
);