-- Create student medications table
CREATE TABLE public.student_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_medications ENABLE ROW LEVEL SECURITY;

-- Students can view their own medications
CREATE POLICY "Students can view their own medications"
ON public.student_medications
FOR SELECT
USING (auth.uid() = student_id);

-- Students can create their own medications
CREATE POLICY "Students can create their own medications"
ON public.student_medications
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own medications
CREATE POLICY "Students can update their own medications"
ON public.student_medications
FOR UPDATE
USING (auth.uid() = student_id);

-- Students can delete their own medications
CREATE POLICY "Students can delete their own medications"
ON public.student_medications
FOR DELETE
USING (auth.uid() = student_id);

-- Teachers can view medications for students in their classrooms
CREATE POLICY "Teachers can view student medications in their classrooms"
ON public.student_medications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON cs.classroom_id = c.id
    WHERE cs.student_id = student_medications.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_student_medications_updated_at
BEFORE UPDATE ON public.student_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();