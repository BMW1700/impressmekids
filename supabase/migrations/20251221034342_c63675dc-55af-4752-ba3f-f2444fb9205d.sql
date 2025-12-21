-- Add foreign key constraint from classroom_announcements.teacher_id to profiles.id
ALTER TABLE public.classroom_announcements 
ADD CONSTRAINT classroom_announcements_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);

-- Add index on classroom_students.student_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_classroom_students_student_id 
ON public.classroom_students(student_id);