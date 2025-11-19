-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Tardy', 'Absent')),
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(classroom_id, student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Teachers can manage attendance for their classrooms
CREATE POLICY "Teachers can manage attendance for their classrooms"
ON public.attendance_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = attendance_records.classroom_id 
    AND teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = attendance_records.classroom_id 
    AND teacher_id = auth.uid()
  )
);

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance"
ON public.attendance_records
FOR SELECT
USING (student_id = auth.uid());

-- Parents can view their children's attendance
CREATE POLICY "Parents can view their children's attendance"
ON public.attendance_records
FOR SELECT
USING (
  student_id IN (
    SELECT psl.student_id
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() AND psl.approved = true
  )
);

-- Add indexes for performance
CREATE INDEX idx_attendance_classroom_date ON public.attendance_records(classroom_id, date);
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, date);

-- Add updated_at trigger
CREATE TRIGGER set_attendance_updated_at
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();