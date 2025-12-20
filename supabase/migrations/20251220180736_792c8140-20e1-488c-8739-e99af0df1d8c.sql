-- Create table for teacher office hours
CREATE TABLE public.teacher_office_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  days_of_week TEXT[] NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_office_hours ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own office hours
CREATE POLICY "Teachers can view their own office hours"
ON public.teacher_office_hours
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own office hours"
ON public.teacher_office_hours
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own office hours"
ON public.teacher_office_hours
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own office hours"
ON public.teacher_office_hours
FOR DELETE
USING (auth.uid() = teacher_id);

-- Students in the classroom can view office hours
CREATE POLICY "Students can view classroom office hours"
ON public.teacher_office_hours
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    WHERE cs.classroom_id = teacher_office_hours.classroom_id
    AND cs.student_id = auth.uid()
  )
);

-- Create trigger for updated_at using existing handle_updated_at function
CREATE TRIGGER update_teacher_office_hours_updated_at
BEFORE UPDATE ON public.teacher_office_hours
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();