-- Create security definer functions to check tournament access
-- This avoids nested RLS policy issues

-- Function to check if user is tournament teacher
CREATE OR REPLACE FUNCTION public.is_tournament_teacher(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = _tournament_id
      AND c.teacher_id = _user_id
  )
$$;

-- Function to check if user is tournament player
CREATE OR REPLACE FUNCTION public.is_tournament_player(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournament_players
    WHERE tournament_id = _tournament_id
      AND profile_id = _user_id
  )
$$;

-- Function to check if user is in tournament classroom
CREATE OR REPLACE FUNCTION public.is_tournament_classroom_member(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    JOIN classroom_students cs ON cs.classroom_id = t.classroom_id
    WHERE t.id = _tournament_id
      AND cs.student_id = _user_id
  )
$$;

-- Drop existing tournament SELECT policies
DROP POLICY IF EXISTS "t_select_student" ON tournaments;
DROP POLICY IF EXISTS "t_select_teacher" ON tournaments;

-- Recreate SELECT policies using security definer functions
CREATE POLICY "t_select_teacher" ON tournaments 
FOR SELECT TO authenticated
USING (is_tournament_teacher(auth.uid(), id));

CREATE POLICY "t_select_player" ON tournaments 
FOR SELECT TO authenticated
USING (is_tournament_player(auth.uid(), id));

CREATE POLICY "t_select_classroom_student" ON tournaments 
FOR SELECT TO authenticated
USING (is_tournament_classroom_member(auth.uid(), id));