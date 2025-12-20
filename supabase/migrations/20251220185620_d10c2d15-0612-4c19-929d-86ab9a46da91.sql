-- Add is_parent_only column to parent_student_events to hide certain events from students
ALTER TABLE public.parent_student_events 
ADD COLUMN is_parent_only BOOLEAN NOT NULL DEFAULT false;