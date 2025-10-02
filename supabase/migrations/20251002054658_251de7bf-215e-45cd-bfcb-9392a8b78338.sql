-- Complete Tournament System - Final Clean Installation

-- Drop existing indexes
DROP INDEX IF EXISTS idx_tournaments_classroom;
DROP INDEX IF EXISTS idx_tournaments_classroom_id;
DROP INDEX IF EXISTS idx_tournament_players_tournament;
DROP INDEX IF EXISTS idx_tournament_players_tournament_id;
DROP INDEX IF EXISTS idx_tournament_players_profile;
DROP INDEX IF EXISTS idx_tournament_players_profile_id;
DROP INDEX IF EXISTS idx_matches_tournament;
DROP INDEX IF EXISTS idx_matches_tournament_id;
DROP INDEX IF EXISTS idx_matches_players;
DROP INDEX IF EXISTS idx_match_events_match;
DROP INDEX IF EXISTS idx_match_events_match_id;
DROP INDEX IF EXISTS idx_match_events_question;
DROP INDEX IF EXISTS idx_match_events_question_id;
DROP INDEX IF EXISTS idx_answers_event;
DROP INDEX IF EXISTS idx_answers_match_event_id;
DROP INDEX IF EXISTS idx_questions_classroom;
DROP INDEX IF EXISTS idx_questions_classroom_id;
DROP INDEX IF EXISTS idx_questions_approved;

-- Drop policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Teachers can create tournaments in their classrooms" ON public.tournaments;
  DROP POLICY IF EXISTS "Teachers view their tournaments" ON public.tournaments;
  DROP POLICY IF EXISTS "Students view their tournaments" ON public.tournaments;
  DROP POLICY IF EXISTS "Teachers update their tournaments" ON public.tournaments;
  DROP POLICY IF EXISTS "Insert tournament players" ON public.tournament_players;
  DROP POLICY IF EXISTS "View own participation" ON public.tournament_players;
  DROP POLICY IF EXISTS "Teachers view players" ON public.tournament_players;
  DROP POLICY IF EXISTS "Update tournament players" ON public.tournament_players;
  DROP POLICY IF EXISTS "Players view own matches" ON public.matches;
  DROP POLICY IF EXISTS "Teachers view matches" ON public.matches;
  DROP POLICY IF EXISTS "Manage matches" ON public.matches;
  DROP POLICY IF EXISTS "Players view events" ON public.match_events;
  DROP POLICY IF EXISTS "Teachers view events" ON public.match_events;
  DROP POLICY IF EXISTS "Manage events" ON public.match_events;
  DROP POLICY IF EXISTS "Players view match state" ON public.match_state;
  DROP POLICY IF EXISTS "Teachers view state" ON public.match_state;
  DROP POLICY IF EXISTS "Manage state" ON public.match_state;
  DROP POLICY IF EXISTS "Players view own answers" ON public.answers;
  DROP POLICY IF EXISTS "Teachers view answers" ON public.answers;
  DROP POLICY IF EXISTS "Insert answers" ON public.answers;
  DROP POLICY IF EXISTS "Teachers view questions" ON public.questions;
  DROP POLICY IF EXISTS "Students view approved" ON public.questions;
  DROP POLICY IF EXISTS "Insert questions" ON public.questions;
  DROP POLICY IF EXISTS "Teachers update questions" ON public.questions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop tables
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.match_state CASCADE;
DROP TABLE IF EXISTS public.match_events CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.tournament_players CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Drop and recreate enums
DROP TYPE IF EXISTS tournament_status CASCADE;
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS elimination_status CASCADE;

CREATE TYPE tournament_status AS ENUM ('waiting', 'in_progress', 'completed');
CREATE TYPE match_status AS ENUM ('waiting', 'in_progress', 'completed');
CREATE TYPE elimination_status AS ENUM ('active', 'eliminated');

-- Install extensions
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Create tables
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status tournament_status NOT NULL DEFAULT 'waiting',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES auth.users(id),
  seed INTEGER NOT NULL,
  status elimination_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  eliminated_at TIMESTAMPTZ,
  UNIQUE(tournament_id, profile_id)
);

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  player_a UUID NOT NULL REFERENCES public.tournament_players(id),
  player_b UUID NOT NULL REFERENCES public.tournament_players(id),
  winner_id UUID REFERENCES public.tournament_players(id),
  status match_status NOT NULL DEFAULT 'waiting',
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CHECK (player_a != player_b)
);

CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  seq SMALLINT NOT NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  buzz_owner_tournament_player_id UUID REFERENCES public.tournament_players(id),
  buzz_at TIMESTAMPTZ,
  answer_deadline TIMESTAMPTZ,
  answered_by_tournament_player_id UUID REFERENCES public.tournament_players(id),
  answer_text TEXT,
  correct BOOLEAN,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, seq)
);

CREATE TABLE public.match_state (
  match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  current_seq SMALLINT NOT NULL DEFAULT 0,
  accepting_buzz BOOLEAN NOT NULL DEFAULT false,
  round_starts_at TIMESTAMPTZ,
  round_ends_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_event_id UUID NOT NULL REFERENCES public.match_events(id) ON DELETE CASCADE,
  tournament_player_id UUID NOT NULL REFERENCES public.tournament_players(id),
  answer_text TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  grading_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance questions
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.classrooms(id);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS distractor_rationale TEXT;

-- Create functions
CREATE OR REPLACE FUNCTION public.compute_levenshtein(a TEXT, b TEXT) RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN RETURN levenshtein(lower(trim(a)), lower(trim(b))); END; $$;

CREATE OR REPLACE FUNCTION public.attempt_buzz(p_match_id UUID, p_seq SMALLINT, p_tournament_player_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID; v_current_buzz_owner UUID; v_accepting_buzz BOOLEAN;
BEGIN
  SELECT ms.accepting_buzz INTO v_accepting_buzz FROM match_state ms WHERE ms.match_id = p_match_id FOR UPDATE;
  IF NOT v_accepting_buzz THEN RETURN jsonb_build_object('success', false, 'error', 'Not accepting buzzes'); END IF;
  SELECT me.id, me.buzz_owner_tournament_player_id INTO v_event_id, v_current_buzz_owner FROM match_events me WHERE me.match_id = p_match_id AND me.seq = p_seq FOR UPDATE OF me;
  IF v_current_buzz_owner IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Already buzzed'); END IF;
  UPDATE match_events SET buzz_owner_tournament_player_id = p_tournament_player_id, buzz_at = now(), answer_deadline = now() + interval '10 seconds' WHERE id = v_event_id;
  UPDATE match_state SET accepting_buzz = false WHERE match_id = p_match_id;
  RETURN jsonb_build_object('success', true, 'buzz_at', now(), 'answer_deadline', now() + interval '10 seconds');
END; $$;

CREATE OR REPLACE FUNCTION public.submit_answer_tx(p_match_id UUID, p_seq SMALLINT, p_tournament_player_id UUID, p_answer_text TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event_id UUID; v_answer_deadline TIMESTAMPTZ; v_buzz_owner UUID; v_canonical_answer TEXT; v_question_type TEXT; v_correct BOOLEAN := false; v_points INTEGER := 0; v_player_a UUID; v_player_b UUID; v_other_player UUID; v_grading_method TEXT := 'exact'; v_levenshtein_distance INTEGER;
BEGIN
  SELECT me.id, me.answer_deadline, me.buzz_owner_tournament_player_id, q.answer_text, q.question_type, m.player_a, m.player_b
  INTO v_event_id, v_answer_deadline, v_buzz_owner, v_canonical_answer, v_question_type, v_player_a, v_player_b
  FROM match_events me JOIN questions q ON q.id = me.question_id JOIN matches m ON m.id = me.match_id
  WHERE me.match_id = p_match_id AND me.seq = p_seq FOR UPDATE OF me;
  IF now() > v_answer_deadline THEN RETURN jsonb_build_object('success', false, 'error', 'Answer deadline expired'); END IF;
  IF v_buzz_owner != p_tournament_player_id THEN RETURN jsonb_build_object('success', false, 'error', 'You did not buzz in'); END IF;
  IF lower(trim(p_answer_text)) = lower(trim(v_canonical_answer)) THEN v_correct := true; v_grading_method := 'exact';
  ELSIF v_question_type = 'short_answer' THEN v_levenshtein_distance := compute_levenshtein(p_answer_text, v_canonical_answer); IF v_levenshtein_distance <= 2 THEN v_correct := true; v_grading_method := 'fuzzy'; END IF;
  END IF;
  IF v_correct THEN v_points := 10; IF p_tournament_player_id = v_player_a THEN UPDATE matches SET score_a = score_a + v_points WHERE id = p_match_id; ELSE UPDATE matches SET score_b = score_b + v_points WHERE id = p_match_id; END IF; END IF;
  UPDATE match_events SET answered_by_tournament_player_id = p_tournament_player_id, answer_text = p_answer_text, correct = v_correct, resolved_at = now() WHERE id = v_event_id;
  INSERT INTO answers (match_event_id, tournament_player_id, answer_text, correct, points_awarded, grading_method) VALUES (v_event_id, p_tournament_player_id, p_answer_text, v_correct, v_points, v_grading_method);
  IF NOT v_correct THEN v_other_player := CASE WHEN p_tournament_player_id = v_player_a THEN v_player_b ELSE v_player_a END;
    UPDATE match_events SET buzz_owner_tournament_player_id = v_other_player, buzz_at = now(), answer_deadline = now() + interval '10 seconds' WHERE id = v_event_id;
    UPDATE match_state SET accepting_buzz = true WHERE match_id = p_match_id; END IF;
  RETURN jsonb_build_object('success', true, 'correct', v_correct, 'points_awarded', v_points, 'grading_method', v_grading_method);
END; $$;

-- Enable RLS and policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "t_insert" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid()));
CREATE POLICY "t_select_teacher" ON public.tournaments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid()));
CREATE POLICY "t_select_student" ON public.tournaments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tournament_players WHERE tournament_id = tournaments.id AND profile_id = auth.uid()));
CREATE POLICY "t_update" ON public.tournaments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid()));

CREATE POLICY "tp_insert" ON public.tournament_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tp_select_own" ON public.tournament_players FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "tp_select_teacher" ON public.tournament_players FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tournaments t JOIN classrooms c ON c.id = t.classroom_id WHERE t.id = tournament_id AND c.teacher_id = auth.uid()));
CREATE POLICY "tp_update" ON public.tournament_players FOR UPDATE TO authenticated USING (true);

CREATE POLICY "m_select_player" ON public.matches FOR SELECT TO authenticated USING (player_a IN (SELECT id FROM tournament_players WHERE profile_id = auth.uid()) OR player_b IN (SELECT id FROM tournament_players WHERE profile_id = auth.uid()));
CREATE POLICY "m_select_teacher" ON public.matches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tournaments t JOIN classrooms c ON c.id = t.classroom_id WHERE t.id = tournament_id AND c.teacher_id = auth.uid()));
CREATE POLICY "m_all" ON public.matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "me_select_player" ON public.match_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM matches m JOIN tournament_players tp ON (m.player_a = tp.id OR m.player_b = tp.id) WHERE m.id = match_id AND tp.profile_id = auth.uid()));
CREATE POLICY "me_select_teacher" ON public.match_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM matches m JOIN tournaments t ON t.id = m.tournament_id JOIN classrooms c ON c.id = t.classroom_id WHERE m.id = match_id AND c.teacher_id = auth.uid()));
CREATE POLICY "me_all" ON public.match_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ms_select_player" ON public.match_state FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM matches m JOIN tournament_players tp ON (m.player_a = tp.id OR m.player_b = tp.id) WHERE m.id = match_id AND tp.profile_id = auth.uid()));
CREATE POLICY "ms_select_teacher" ON public.match_state FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM matches m JOIN tournaments t ON t.id = m.tournament_id JOIN classrooms c ON c.id = t.classroom_id WHERE m.id = match_id AND c.teacher_id = auth.uid()));
CREATE POLICY "ms_all" ON public.match_state FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "a_select_player" ON public.answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tournament_players WHERE id = tournament_player_id AND profile_id = auth.uid()));
CREATE POLICY "a_select_teacher" ON public.answers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM match_events me JOIN matches m ON m.id = me.match_id JOIN tournaments t ON t.id = m.tournament_id JOIN classrooms c ON c.id = t.classroom_id WHERE me.id = match_event_id AND c.teacher_id = auth.uid()));
CREATE POLICY "a_insert" ON public.answers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "q_select_teacher" ON public.questions FOR SELECT TO authenticated USING (approved = true OR created_by = auth.uid() OR classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()));
CREATE POLICY "q_select_student" ON public.questions FOR SELECT TO authenticated USING (approved = true);
CREATE POLICY "q_insert" ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "q_update" ON public.questions FOR UPDATE TO authenticated USING (created_by = auth.uid() OR classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;

-- Create indexes
CREATE INDEX idx_tourn_class ON public.tournaments(classroom_id);
CREATE INDEX idx_tp_tourn ON public.tournament_players(tournament_id);
CREATE INDEX idx_tp_prof ON public.tournament_players(profile_id);
CREATE INDEX idx_match_tourn ON public.matches(tournament_id);
CREATE INDEX idx_match_play ON public.matches(player_a, player_b);
CREATE INDEX idx_me_match ON public.match_events(match_id);
CREATE INDEX idx_me_quest ON public.match_events(question_id);
CREATE INDEX idx_ans_event ON public.answers(match_event_id);
CREATE INDEX idx_q_class ON public.questions(classroom_id);
CREATE INDEX idx_q_appr ON public.questions(approved);