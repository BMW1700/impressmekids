
-- Phase 1: Scale readiness — covering indexes, realtime trim, classroom-context RPC

-- 1) Covering indexes on auth-critical tables (preemptive: planner will switch as rows grow)
CREATE INDEX IF NOT EXISTS idx_parent_accounts_user_id
  ON public.parent_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id
  ON public.classrooms (teacher_id);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_approved_student
  ON public.parent_student_links (parent_id, approved, student_id);

CREATE INDEX IF NOT EXISTS idx_classroom_students_student_classroom
  ON public.classroom_students (student_id, classroom_id);

CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom_student
  ON public.classroom_students (classroom_id, student_id);

-- Hot ORDER BY descending fetch
CREATE INDEX IF NOT EXISTS idx_campaign_battle_sessions_student_mode_created
  ON public.campaign_battle_sessions (student_id, grade_mode, created_at DESC);

-- 2) Trim supabase_realtime publication: remove tables with no postgres_changes subscribers in app code.
-- Keeping (confirmed subscribers): app_settings, assignment_questions, assignments, drill_attendance,
-- drill_sessions, games, group_chat_messages, matches, multiplayer_rooms, parent_access_requests,
-- parent_drill_responses, pvp_room_events, safety_alerts, visitors
DO $$
DECLARE
  t text;
  drop_list text[] := ARRAY[
    'answers',
    'assignment_answers',
    'assignment_group_members',
    'classroom_announcements',
    'drill_visitor_attendance',
    'escalation_notifications',
    'game_answers',
    'game_players',
    'game_rounds',
    'match_events',
    'match_state',
    'realtime_practice_sessions',
    'tournament_players',
    'tournament_questions',
    'tournaments'
  ];
BEGIN
  FOREACH t IN ARRAY drop_list LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- 3) Classroom-context RPC: collapses the PostgREST LATERAL embed
-- (classroom_students -> classrooms -> profiles) into one indexed query.
CREATE OR REPLACE FUNCTION public.get_student_classroom_context(_student_id uuid)
RETURNS TABLE (
  classroom_id uuid,
  joined_at timestamptz,
  id uuid,
  name text,
  subject text,
  grade text,
  join_code text,
  teacher_id uuid,
  created_at timestamptz,
  teacher_full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cs.classroom_id,
    cs.joined_at,
    c.id,
    c.name,
    c.subject,
    c.grade,
    c.join_code,
    c.teacher_id,
    c.created_at,
    p.full_name AS teacher_full_name
  FROM public.classroom_students cs
  JOIN public.classrooms c ON c.id = cs.classroom_id
  LEFT JOIN public.profiles p ON p.id = c.teacher_id
  WHERE cs.student_id = _student_id
    AND (
      auth.uid() = _student_id
      OR public.is_parent_of_student(_student_id)
      OR public.is_teacher_of_student(_student_id)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    );
$$;

REVOKE ALL ON FUNCTION public.get_student_classroom_context(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_classroom_context(uuid) TO authenticated, service_role;

ANALYZE public.parent_accounts;
ANALYZE public.classrooms;
ANALYZE public.parent_student_links;
ANALYZE public.classroom_students;
ANALYZE public.campaign_battle_sessions;
