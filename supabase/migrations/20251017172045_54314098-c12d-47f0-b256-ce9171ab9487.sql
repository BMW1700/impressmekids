-- Fix remaining RLS circular dependencies for INSERT, UPDATE, DELETE operations

-- ============================================
-- ASSIGNMENTS TABLE - Fix INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Teachers can create assignments in their classrooms" ON public.assignments;

CREATE POLICY "Teachers can create assignments in their classrooms"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.is_classroom_teacher(auth.uid(), classroom_id));

-- ============================================
-- TOURNAMENTS TABLE - Fix INSERT, UPDATE, DELETE policies
-- ============================================
DROP POLICY IF EXISTS "t_insert" ON public.tournaments;
DROP POLICY IF EXISTS "t_update" ON public.tournaments;
DROP POLICY IF EXISTS "Teachers can delete tournaments in their classrooms" ON public.tournaments;

CREATE POLICY "t_insert"
ON public.tournaments
FOR INSERT
TO authenticated
WITH CHECK (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "t_update"
ON public.tournaments
FOR UPDATE
TO authenticated
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Teachers can delete tournaments in their classrooms"
ON public.tournaments
FOR DELETE
TO authenticated
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

-- ============================================
-- ASSIGNMENT_SUBMISSIONS TABLE - Fix policies that query assignments->classrooms
-- ============================================
DROP POLICY IF EXISTS "Teachers can view submissions for their classroom assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers can update submissions for grading" ON public.assignment_submissions;

-- Create security definer function to check if user is teacher of submission's classroom
CREATE OR REPLACE FUNCTION public.is_submission_teacher(_user_id uuid, _submission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM assignment_submissions asub
    JOIN assignments a ON a.id = asub.assignment_id
    WHERE asub.id = _submission_id
      AND a.teacher_id = _user_id
  )
$$;

CREATE POLICY "Teachers can view submissions for their classroom assignments"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_submission_teacher(auth.uid(), id)
);

CREATE POLICY "Teachers can update submissions for grading"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
  OR public.is_submission_teacher(auth.uid(), id)
);