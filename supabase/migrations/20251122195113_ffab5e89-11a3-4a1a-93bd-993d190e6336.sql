-- Add question_type column to questions table
ALTER TABLE public.questions 
ADD COLUMN question_type TEXT 
CHECK (question_type IN ('mcq', 'short', 'tf', 'fill'));

-- Set default value for any existing questions
UPDATE public.questions 
SET question_type = 'mcq' 
WHERE question_type IS NULL;