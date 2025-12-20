-- Add date columns for recurring and single-day office hours
ALTER TABLE public.teacher_office_hours 
ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN specific_date DATE,
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;