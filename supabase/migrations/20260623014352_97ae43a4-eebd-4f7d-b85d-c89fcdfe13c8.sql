-- =========================================================
-- P0 Scale Readiness Migration: RLS Subquery Flattening
-- =========================================================

-- ---------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER, STABLE)
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = _student_id
      AND c.teacher_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_classroom(_classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = _classroom_id
      AND c.teacher_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_accounts pa
    JOIN public.parent_student_links psl ON psl.parent_id = pa.id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = _student_id
      AND psl.approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.parent_has_aura_consent(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_accounts pa
    JOIN public.parent_student_links psl ON psl.parent_id = pa.id
    JOIN public.parent_consents pc ON pc.parent_id = pa.id AND pc.student_id = psl.student_id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = _student_id
      AND psl.approved = true
      AND pc.aura_recording_consent = true
  )
$$;

-- Lock down EXECUTE
REVOKE ALL ON FUNCTION public.is_teacher_of_student(uuid)    FROM public;
REVOKE ALL ON FUNCTION public.is_teacher_of_classroom(uuid)  FROM public;
REVOKE ALL ON FUNCTION public.is_parent_of_student(uuid)     FROM public;
REVOKE ALL ON FUNCTION public.parent_has_aura_consent(uuid)  FROM public;

GRANT EXECUTE ON FUNCTION public.is_teacher_of_student(uuid)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_classroom(uuid)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_parent_of_student(uuid)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.parent_has_aura_consent(uuid)  TO authenticated, service_role;

-- ---------------------------------------------------------
-- 2. student_behavior_stats
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view their children's stats"     ON public.student_behavior_stats;
DROP POLICY IF EXISTS "Teachers can view stats in their classrooms" ON public.student_behavior_stats;
DROP POLICY IF EXISTS "Teachers can update stats in their classrooms" ON public.student_behavior_stats;

CREATE POLICY "Parents can view their children's stats"
  ON public.student_behavior_stats FOR SELECT TO authenticated
  USING (public.is_parent_of_student(student_id));

CREATE POLICY "Teachers can view stats in their classrooms"
  ON public.student_behavior_stats FOR SELECT TO authenticated
  USING (public.is_teacher_of_classroom(classroom_id));

CREATE POLICY "Teachers can update stats in their classrooms"
  ON public.student_behavior_stats FOR UPDATE TO authenticated
  USING (public.is_teacher_of_classroom(classroom_id));

-- ---------------------------------------------------------
-- 3. reading_sessions
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view linked student reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Teachers can view reading sessions for their students" ON public.reading_sessions;

CREATE POLICY "Parents can view linked student reading sessions"
  ON public.reading_sessions FOR SELECT TO authenticated
  USING (public.parent_has_aura_consent(student_id));

CREATE POLICY "Teachers can view reading sessions for their students"
  ON public.reading_sessions FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(student_id));

-- ---------------------------------------------------------
-- 4. aura_records
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Parents can view linked student aura records" ON public.aura_records;
DROP POLICY IF EXISTS "Teachers can view aura records for their students" ON public.aura_records;

CREATE POLICY "Parents can view linked student aura records"
  ON public.aura_records FOR SELECT TO authenticated
  USING (public.parent_has_aura_consent(profile_id));

CREATE POLICY "Teachers can view aura records for their students"
  ON public.aura_records FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(profile_id));

-- ---------------------------------------------------------
-- 5. campaign_battle_sessions
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view student battle sessions" ON public.campaign_battle_sessions;

CREATE POLICY "Teachers can view student battle sessions"
  ON public.campaign_battle_sessions FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(student_id));

-- ---------------------------------------------------------
-- 6. parent_student_links
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view links for their students"   ON public.parent_student_links;
DROP POLICY IF EXISTS "Teachers can update links for their students" ON public.parent_student_links;

CREATE POLICY "Teachers can view links for their students"
  ON public.parent_student_links FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(student_id));

CREATE POLICY "Teachers can update links for their students"
  ON public.parent_student_links FOR UPDATE TO authenticated
  USING (public.is_teacher_of_student(student_id));

-- ---------------------------------------------------------
-- 7. student_reading_stats
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can view reading stats for their students" ON public.student_reading_stats;

CREATE POLICY "Teachers can view reading stats for their students"
  ON public.student_reading_stats FOR SELECT TO authenticated
  USING (public.is_teacher_of_student(student_id));

-- ---------------------------------------------------------
-- 8. Preventive index: user_roles(user_id, role)
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role
  ON public.user_roles (user_id, role);

-- ---------------------------------------------------------
-- 9. Refresh planner statistics on affected tables
-- ---------------------------------------------------------
ANALYZE public.user_roles;
ANALYZE public.student_behavior_stats;
ANALYZE public.reading_sessions;
ANALYZE public.aura_records;
ANALYZE public.campaign_battle_sessions;
ANALYZE public.parent_student_links;
ANALYZE public.student_reading_stats;
ANALYZE public.classroom_students;
ANALYZE public.classrooms;
ANALYZE public.parent_accounts;
ANALYZE public.parent_consents;
