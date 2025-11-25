-- Step 1: Create a reliable SECURITY DEFINER function to check tournament_questions access
CREATE OR REPLACE FUNCTION public.can_read_tournament_questions(_tournament_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = _tournament_id
      AND c.teacher_id = _user_id
  )
$$;

-- Step 2: Drop the existing complex RLS policy on tournament_questions
DROP POLICY IF EXISTS "tq_select_teacher" ON public.tournament_questions;

-- Step 3: Create a simpler, more reliable SELECT policy using the helper function
CREATE POLICY "tq_select_teacher" ON public.tournament_questions
FOR SELECT
USING (public.can_read_tournament_questions(tournament_id, auth.uid()));

-- Step 4: Ensure the INSERT policy is also using a reliable check
DROP POLICY IF EXISTS "tq_insert" ON public.tournament_questions;

CREATE POLICY "tq_insert" ON public.tournament_questions
FOR INSERT
WITH CHECK (public.can_read_tournament_questions(tournament_id, auth.uid()));

-- Step 5: Ensure the DELETE policy is also using a reliable check
DROP POLICY IF EXISTS "tq_delete" ON public.tournament_questions;

CREATE POLICY "tq_delete" ON public.tournament_questions
FOR DELETE
USING (public.can_read_tournament_questions(tournament_id, auth.uid()));