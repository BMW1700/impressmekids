-- Phonics Foundations mastery tracking (World 0)
CREATE TABLE IF NOT EXISTS public.phonics_foundations_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  mastered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  words_correct INTEGER NOT NULL DEFAULT 0,
  words_attempted INTEGER NOT NULL DEFAULT 0,
  accuracy_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, stage_id)
);

CREATE INDEX IF NOT EXISTS idx_phonics_foundations_progress_student
  ON public.phonics_foundations_progress(student_id);

ALTER TABLE public.phonics_foundations_progress ENABLE ROW LEVEL SECURITY;

-- Students manage their own progress
CREATE POLICY "Students view own phonics progress"
ON public.phonics_foundations_progress
FOR SELECT TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Students insert own phonics progress"
ON public.phonics_foundations_progress
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own phonics progress"
ON public.phonics_foundations_progress
FOR UPDATE TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Teachers see progress for students in their classrooms
CREATE POLICY "Teachers view students phonics progress"
ON public.phonics_foundations_progress
FOR SELECT TO authenticated
USING (public.is_teacher_of_student(auth.uid(), student_id));

-- Parents see progress for approved children
CREATE POLICY "Parents view children phonics progress"
ON public.phonics_foundations_progress
FOR SELECT TO authenticated
USING (public.can_parent_view_student_profile(auth.uid(), student_id));

-- updated_at trigger
CREATE TRIGGER trg_phonics_foundations_progress_updated_at
BEFORE UPDATE ON public.phonics_foundations_progress
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();