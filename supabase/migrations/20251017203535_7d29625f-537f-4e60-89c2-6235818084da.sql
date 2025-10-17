-- Drop the old unique constraint that prevents multiple attempts per assignment
-- This constraint was blocking students from creating attempt 2, 3, etc.
-- The new constraint unique_assignment_student_attempt (assignment_id, student_id, attempt_number) 
-- already ensures data integrity for multiple attempts

ALTER TABLE public.assignment_submissions
DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_student_id_key;

-- Add comment to document the remaining constraint
COMMENT ON CONSTRAINT unique_assignment_student_attempt ON public.assignment_submissions 
IS 'Allows multiple attempts per assignment - ensures one unique submission per attempt number';