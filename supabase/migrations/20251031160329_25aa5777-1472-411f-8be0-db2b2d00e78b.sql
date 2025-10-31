-- Add grade and subject columns to classrooms table
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS grade integer,
ADD COLUMN IF NOT EXISTS subject text;