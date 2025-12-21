-- Add meeting_type to teacher_office_hours (in_person or virtual)
ALTER TABLE public.teacher_office_hours 
ADD COLUMN meeting_type text NOT NULL DEFAULT 'in_person';

-- Add virtual_meeting_link to profiles for teachers to save their default link
ALTER TABLE public.profiles 
ADD COLUMN virtual_meeting_link text;