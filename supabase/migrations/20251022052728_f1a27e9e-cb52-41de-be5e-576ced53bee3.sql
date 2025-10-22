-- ============================================================================
-- ISSUE #7 FIX: Prevent Quiz Question Leaks
-- ============================================================================
-- Students should NOT see questions until they're actively shown during tournament matches.

-- ============================================================================
-- PART 1: Add shown_at column to match_events
-- ============================================================================

ALTER TABLE public.match_events 
ADD COLUMN IF NOT EXISTS shown_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- PART 2: Secure the 'questions' table
-- ============================================================================

-- Drop overly permissive policies that allow students to see all approved questions
DROP POLICY IF EXISTS "Students can view approved questions" ON public.questions;
DROP POLICY IF EXISTS "q_select_student" ON public.questions;

-- Students can only view questions that have been shown in their tournament matches
CREATE POLICY "Students can view questions shown in their tournament matches"
ON public.questions
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT me.question_id
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN tournament_players tp ON (tp.id = m.player_a OR tp.id = m.player_b)
    WHERE tp.profile_id = auth.uid()
      AND me.shown_at IS NOT NULL  -- Question must have been shown
  )
);

-- ============================================================================
-- PART 3: Secure 'tournament_questions' table
-- ============================================================================

-- Drop the overly permissive policy that shows all tournament questions to players
DROP POLICY IF EXISTS "tq_select_student" ON public.tournament_questions;

-- Students can only see tournament questions that have been shown in their matches
CREATE POLICY "Students can view tournament questions only when shown in matches"
ON public.tournament_questions
FOR SELECT
TO authenticated
USING (
  question_id IN (
    SELECT me.question_id
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN tournament_players tp ON (tp.id = m.player_a OR tp.id = m.player_b)
    WHERE tp.profile_id = auth.uid()
      AND me.shown_at IS NOT NULL  -- Only shown questions
  )
);