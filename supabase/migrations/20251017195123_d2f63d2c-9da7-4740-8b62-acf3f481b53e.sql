-- Add points field to assignment_questions table
ALTER TABLE public.assignment_questions
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;

-- Add points_earned and is_correct fields to assignment_answers table
ALTER TABLE public.assignment_answers
ADD COLUMN IF NOT EXISTS points_earned NUMERIC,
ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;

-- Add comment to explain the grading fields
COMMENT ON COLUMN public.assignment_questions.points IS 'Number of points this question is worth';
COMMENT ON COLUMN public.assignment_answers.points_earned IS 'Points earned by student for this answer (null if not yet graded)';
COMMENT ON COLUMN public.assignment_answers.is_correct IS 'Whether the answer is correct (auto-graded for multiple choice/true-false, null for manual grading)';