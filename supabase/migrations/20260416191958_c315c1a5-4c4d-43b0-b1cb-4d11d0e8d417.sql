-- Enforce uniqueness of student_id across profiles (only when set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_student_id_unique_idx
  ON public.profiles (student_id)
  WHERE student_id IS NOT NULL;