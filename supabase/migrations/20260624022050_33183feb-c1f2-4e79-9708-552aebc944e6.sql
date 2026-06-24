
-- =====================================================================
-- Phase B: RLS performance consolidation on next tier of hot tables
-- Same access semantics, fewer policies per row, cached auth.uid()
-- =====================================================================

-- ---------- reading_sessions ----------
DROP POLICY IF EXISTS "Students can view their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "game_player_read_own_reading_sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Parents can view linked student reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "Teachers can view reading sessions for their students" ON public.reading_sessions;

CREATE POLICY "reading_sessions_select_consolidated"
ON public.reading_sessions
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_teacher_of_student(student_id)
  OR public.parent_has_aura_consent(student_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ---------- aura_records ----------
DROP POLICY IF EXISTS "Students can view their own aura records" ON public.aura_records;
DROP POLICY IF EXISTS "game_player_read_own_aura_records" ON public.aura_records;
DROP POLICY IF EXISTS "Parents can view linked student aura records" ON public.aura_records;
DROP POLICY IF EXISTS "Teachers can view aura records for their students" ON public.aura_records;
DROP POLICY IF EXISTS "Admins can view all aura records" ON public.aura_records;

CREATE POLICY "aura_records_select_consolidated"
ON public.aura_records
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR public.is_teacher_of_student(profile_id)
  OR public.parent_has_aura_consent(profile_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ---------- aura_access_log ----------
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.aura_access_log;

CREATE POLICY "aura_access_log_select_admins"
ON public.aura_access_log
FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ---------- campaign_battle_sessions ----------
DROP POLICY IF EXISTS "Students can view own battle sessions" ON public.campaign_battle_sessions;
DROP POLICY IF EXISTS "game_player_read_own_battles" ON public.campaign_battle_sessions;
DROP POLICY IF EXISTS "Teachers can view student battle sessions" ON public.campaign_battle_sessions;

CREATE POLICY "campaign_battle_sessions_select_consolidated"
ON public.campaign_battle_sessions
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_teacher_of_student(student_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ---------- classrooms ----------
DROP POLICY IF EXISTS "Teachers can view their own classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Students can view classrooms they're in" ON public.classrooms;
DROP POLICY IF EXISTS "Parents can view their children's classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Admins can view all classrooms" ON public.classrooms;

CREATE POLICY "classrooms_select_consolidated"
ON public.classrooms
FOR SELECT
TO authenticated
USING (
  teacher_id = (SELECT auth.uid())
  OR public.is_classroom_student((SELECT auth.uid()), id)
  OR public.can_parent_view_classroom((SELECT auth.uid()), id)
  OR public.admin_can_view_classroom((SELECT auth.uid()), teacher_id)
);

-- ---------- parent_accounts ----------
DROP POLICY IF EXISTS "Parents can view their own account" ON public.parent_accounts;
DROP POLICY IF EXISTS "Admins can view all parent accounts" ON public.parent_accounts;
DROP POLICY IF EXISTS "Teachers can view parent accounts for approved students only" ON public.parent_accounts;

CREATE POLICY "parent_accounts_select_consolidated"
ON public.parent_accounts
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  OR id IN (
    SELECT psl.parent_id
    FROM public.parent_student_links psl
    JOIN public.classroom_students cs ON cs.student_id = psl.student_id
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = (SELECT auth.uid())
      AND psl.approved = true
  )
);

-- ---------- parent_student_links ----------
DROP POLICY IF EXISTS "Students can view their own parent links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Parents can view their own links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Teachers can view links for their students" ON public.parent_student_links;
DROP POLICY IF EXISTS "Admins can view all parent-student links" ON public.parent_student_links;
DROP POLICY IF EXISTS "Admins can view all parent links" ON public.parent_student_links;

CREATE POLICY "parent_student_links_select_consolidated"
ON public.parent_student_links
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR parent_id = public.get_parent_id((SELECT auth.uid()))
  OR public.is_teacher_of_student(student_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ---------- student_reading_stats ----------
-- Existing: ALL policy for students (covers SELECT) + separate student SELECT + teacher SELECT + game_player SELECT
-- Consolidate into: 1 SELECT for all readers, keep student write policies explicit
DROP POLICY IF EXISTS "Students can view their own reading stats" ON public.student_reading_stats;
DROP POLICY IF EXISTS "game_player_read_own_reading_stats" ON public.student_reading_stats;
DROP POLICY IF EXISTS "Teachers can view reading stats for their students" ON public.student_reading_stats;
DROP POLICY IF EXISTS "Students can update their own reading stats" ON public.student_reading_stats;

CREATE POLICY "student_reading_stats_select_consolidated"
ON public.student_reading_stats
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_teacher_of_student(student_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "student_reading_stats_insert_own"
ON public.student_reading_stats
FOR INSERT
TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_reading_stats_update_own"
ON public.student_reading_stats
FOR UPDATE
TO authenticated
USING (student_id = (SELECT auth.uid()))
WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "student_reading_stats_delete_own"
ON public.student_reading_stats
FOR DELETE
TO authenticated
USING (student_id = (SELECT auth.uid()));
