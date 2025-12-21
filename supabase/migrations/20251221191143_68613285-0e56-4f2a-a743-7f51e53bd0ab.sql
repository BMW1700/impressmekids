-- Create student_allergies table
CREATE TABLE public.student_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  allergy_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_allergies ENABLE ROW LEVEL SECURITY;

-- Students can view their own allergies
CREATE POLICY "Students can view own allergies"
ON public.student_allergies FOR SELECT
USING (auth.uid() = student_id);

-- Students can create their own allergies
CREATE POLICY "Students can create own allergies"
ON public.student_allergies FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own allergies
CREATE POLICY "Students can update own allergies"
ON public.student_allergies FOR UPDATE
USING (auth.uid() = student_id);

-- Students can delete their own allergies
CREATE POLICY "Students can delete own allergies"
ON public.student_allergies FOR DELETE
USING (auth.uid() = student_id);

-- Teachers can view allergies for students in their classrooms
CREATE POLICY "Teachers can view student allergies"
ON public.student_allergies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON cs.classroom_id = c.id
    WHERE cs.student_id = student_allergies.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_student_allergies_updated_at
BEFORE UPDATE ON public.student_allergies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();