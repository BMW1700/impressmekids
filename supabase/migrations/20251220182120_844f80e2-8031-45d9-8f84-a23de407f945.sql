-- Add meeting duration column to teacher_office_hours
ALTER TABLE public.teacher_office_hours 
ADD COLUMN meeting_duration_minutes INTEGER NOT NULL DEFAULT 30;