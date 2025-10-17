-- Add max_attempts column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.assignments.max_attempts IS 'Maximum number of attempts a student can make on this assignment';

-- Add attempt_number column to assignment_submissions table
ALTER TABLE public.assignment_submissions 
ADD COLUMN attempt_number INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.assignment_submissions.attempt_number IS 'Which attempt number this submission represents (1, 2, 3, etc.)';

-- Add unique constraint to prevent duplicate attempts
ALTER TABLE public.assignment_submissions
ADD CONSTRAINT unique_assignment_student_attempt UNIQUE (assignment_id, student_id, attempt_number);