-- First drop the dependent policy
DROP POLICY IF EXISTS "Students can view classroom office hours" ON public.teacher_office_hours;

-- Now remove classroom_id from teacher_office_hours to make office hours teacher-wide
ALTER TABLE public.teacher_office_hours DROP COLUMN classroom_id;

-- Update RLS policies to be based on teacher_id only
DROP POLICY IF EXISTS "Teachers can manage their office hours" ON public.teacher_office_hours;

-- Teachers can manage their own office hours
CREATE POLICY "Teachers can manage their office hours"
ON public.teacher_office_hours
FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Everyone can view office hours (students need to see their teachers' availability)
CREATE POLICY "Anyone can view office hours"
ON public.teacher_office_hours
FOR SELECT
USING (true);