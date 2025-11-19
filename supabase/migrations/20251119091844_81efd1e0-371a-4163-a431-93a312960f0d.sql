-- Add category column to assignments table
ALTER TABLE public.assignments
ADD COLUMN category TEXT NOT NULL DEFAULT 'Homework'
CHECK (category IN ('Test', 'Quiz', 'Homework'));

-- Add comment for documentation
COMMENT ON COLUMN public.assignments.category IS 'Assignment category: Test, Quiz, or Homework';

-- Create index for better query performance
CREATE INDEX idx_assignments_category ON public.assignments(category);