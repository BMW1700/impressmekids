-- Ensure Aura Records are protected but visible to the right people
ALTER TABLE public.aura_records ENABLE ROW LEVEL SECURITY;

-- Students: read their own Aura records
DROP POLICY IF EXISTS "Students can view their own aura records" ON public.aura_records;
CREATE POLICY "Students can view their own aura records"
ON public.aura_records
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- Students: create their own Aura records
DROP POLICY IF EXISTS "Students can insert their own aura records" ON public.aura_records;
CREATE POLICY "Students can insert their own aura records"
ON public.aura_records
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Students: update their own Aura records (optional but safe)
DROP POLICY IF EXISTS "Students can update their own aura records" ON public.aura_records;
CREATE POLICY "Students can update their own aura records"
ON public.aura_records
FOR UPDATE
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Students: delete their own Aura records (optional but safe)
DROP POLICY IF EXISTS "Students can delete their own aura records" ON public.aura_records;
CREATE POLICY "Students can delete their own aura records"
ON public.aura_records
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Teachers: view Aura records for students in their classrooms
DROP POLICY IF EXISTS "Teachers can view aura records for their students" ON public.aura_records;
CREATE POLICY "Teachers can view aura records for their students"
ON public.aura_records
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT cs.student_id
    FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- Admins: view all aura records (optional, for safety/debug)
DROP POLICY IF EXISTS "Admins can view all aura records" ON public.aura_records;
CREATE POLICY "Admins can view all aura records"
ON public.aura_records
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Helpful indexes for teacher analytics / cross-model scatter
CREATE INDEX IF NOT EXISTS idx_aura_records_profile_id_created_at ON public.aura_records (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_students_classroom_id_student_id ON public.classroom_students (classroom_id, student_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON public.classrooms (teacher_id);