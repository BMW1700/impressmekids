-- =====================================================
-- SECURITY FIX: Remove overly permissive RLS policies
-- Fix tournament game tables that use USING (true)
-- =====================================================

-- 1. Fix tournament_players UPDATE policy
-- Anyone can currently update ANY player record
DROP POLICY IF EXISTS "tp_update" ON public.tournament_players;

-- Only allow users to update their own player record OR teachers to update records in their tournaments
CREATE POLICY "tp_update" ON public.tournament_players
FOR UPDATE
TO authenticated
USING (
  -- User can update their own record
  profile_id = auth.uid()
  OR
  -- Teacher can update records in their tournaments
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_id AND c.teacher_id = auth.uid()
  )
);

-- 2. Fix matches ALL policy - currently anyone can CRUD all matches
DROP POLICY IF EXISTS "m_all" ON public.matches;

-- Teachers can manage matches in their tournaments
CREATE POLICY "m_manage_teacher" ON public.matches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_id AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = tournament_id AND c.teacher_id = auth.uid()
  )
);

-- 3. Fix match_events ALL policy - currently anyone can CRUD all match events
DROP POLICY IF EXISTS "me_all" ON public.match_events;

-- Teachers can manage match events in their tournaments
CREATE POLICY "me_manage_teacher" ON public.match_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE m.id = match_id AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE m.id = match_id AND c.teacher_id = auth.uid()
  )
);

-- 4. Fix match_state ALL policy - currently anyone can manipulate game state
DROP POLICY IF EXISTS "ms_all" ON public.match_state;

-- Teachers can manage match state in their tournaments
CREATE POLICY "ms_manage_teacher" ON public.match_state
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE m.id = match_id AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE m.id = match_id AND c.teacher_id = auth.uid()
  )
);

-- 5. Fix answers INSERT policy - currently anyone can submit answers for any player
DROP POLICY IF EXISTS "a_insert" ON public.answers;

-- Only allow users to insert answers for their own tournament player record
CREATE POLICY "a_insert" ON public.answers
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must own the tournament_player_id they're submitting for
  EXISTS (
    SELECT 1 FROM tournament_players tp
    WHERE tp.id = tournament_player_id AND tp.profile_id = auth.uid()
  )
);

-- 6. Fix questions INSERT policy - currently anyone can inject questions
DROP POLICY IF EXISTS "q_insert" ON public.questions;

-- Only teachers can insert questions (for their classrooms)
CREATE POLICY "q_insert" ON public.questions
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be a teacher of the classroom the question belongs to
  classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid())
  OR
  -- Or be the creator (for personal questions)
  created_by = auth.uid()
);

-- 7. Fix reading_library INSERT policy - currently any authenticated user can insert stories
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON public.reading_library;

-- Only teachers and admins can add stories to the library
CREATE POLICY "Teachers and admins can insert stories" ON public.reading_library
FOR INSERT
TO authenticated
WITH CHECK (
  -- User is the creator AND is a teacher or admin
  created_by = auth.uid()
  AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('teacher'::app_role, 'admin'::app_role)
  )
);