
-- ============================================================
-- PHASE A: RLS PERFORMANCE PASS
-- Consolidate overlapping SELECT policies + use (SELECT auth.uid())
-- to avoid per-row re-evaluation. Access semantics unchanged.
-- ============================================================

-- ---------- student_behavior_stats ----------
DROP POLICY IF EXISTS "Parents can view their children's stats" ON public.student_behavior_stats;
DROP POLICY IF EXISTS "Students can view their own stats" ON public.student_behavior_stats;
DROP POLICY IF EXISTS "Teachers can view stats in their classrooms" ON public.student_behavior_stats;
DROP POLICY IF EXISTS "Teachers can update stats in their classrooms" ON public.student_behavior_stats;

CREATE POLICY "behavior_stats_select_consolidated"
ON public.student_behavior_stats
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_teacher_of_classroom(classroom_id)
  OR public.is_parent_of_student(student_id)
);

CREATE POLICY "behavior_stats_update_teacher"
ON public.student_behavior_stats
FOR UPDATE
TO authenticated
USING (public.is_teacher_of_classroom(classroom_id))
WITH CHECK (public.is_teacher_of_classroom(classroom_id));

-- ---------- classroom_students ----------
DROP POLICY IF EXISTS "Admins can view all classroom students" ON public.classroom_students;
DROP POLICY IF EXISTS "Parents can view their children's classroom enrollments" ON public.classroom_students;
DROP POLICY IF EXISTS "Students can view their own classroom memberships" ON public.classroom_students;
DROP POLICY IF EXISTS "Teachers can view students in their classrooms" ON public.classroom_students;

CREATE POLICY "classroom_students_select_consolidated"
ON public.classroom_students
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_classroom_teacher((SELECT auth.uid()), classroom_id)
  OR public.is_parent_of_student((SELECT auth.uid()), student_id)
  OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
);

-- ---------- attendance_records ----------
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Teachers can manage attendance for their classrooms" ON public.attendance_records;

CREATE POLICY "attendance_select_consolidated"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_parent_of_student((SELECT auth.uid()), student_id)
  OR EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = attendance_records.classroom_id
      AND c.teacher_id = (SELECT auth.uid())
  )
);

CREATE POLICY "attendance_write_teacher"
ON public.attendance_records
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = attendance_records.classroom_id
      AND c.teacher_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = attendance_records.classroom_id
      AND c.teacher_id = (SELECT auth.uid())
  )
);

-- ---------- assignment_submissions ----------
DROP POLICY IF EXISTS "Parents can view linked student submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for their classroom assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers can update submissions for grading" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.assignment_submissions;

CREATE POLICY "submissions_select_consolidated"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_submission_teacher((SELECT auth.uid()), id)
  OR student_id IN (
    SELECT psl.student_id
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = (SELECT auth.uid()) AND psl.approved = true
  )
);

CREATE POLICY "submissions_insert_student"
ON public.assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "submissions_update_consolidated"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.is_submission_teacher((SELECT auth.uid()), id)
)
WITH CHECK (
  student_id = (SELECT auth.uid())
  OR public.is_submission_teacher((SELECT auth.uid()), id)
);

-- ---------- assignments ----------
DROP POLICY IF EXISTS "Parents can view posted assignments for their children" ON public.assignments;
DROP POLICY IF EXISTS "Students can view published and posted assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can view assignments in their classrooms" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can create assignments in their classrooms" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can delete their own assignments" ON public.assignments;

CREATE POLICY "assignments_select_consolidated"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  public.is_classroom_teacher((SELECT auth.uid()), classroom_id)
  OR (
    status = 'published'
    AND is_posted = true
    AND (
      public.is_classroom_student((SELECT auth.uid()), classroom_id)
      OR classroom_id IN (
        SELECT cs.classroom_id
        FROM public.classroom_students cs
        JOIN public.parent_student_links psl ON psl.student_id = cs.student_id
        JOIN public.parent_accounts pa ON pa.id = psl.parent_id
        WHERE pa.user_id = (SELECT auth.uid()) AND psl.approved = true
      )
    )
  )
);

CREATE POLICY "assignments_insert_teacher"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (public.is_classroom_teacher((SELECT auth.uid()), classroom_id));

CREATE POLICY "assignments_update_teacher"
ON public.assignments
FOR UPDATE
TO authenticated
USING (teacher_id = (SELECT auth.uid()))
WITH CHECK (teacher_id = (SELECT auth.uid()));

CREATE POLICY "assignments_delete_teacher"
ON public.assignments
FOR DELETE
TO authenticated
USING (teacher_id = (SELECT auth.uid()));
