-- Add schedule_end_date column to classrooms table
ALTER TABLE public.classrooms
ADD COLUMN schedule_end_date DATE;