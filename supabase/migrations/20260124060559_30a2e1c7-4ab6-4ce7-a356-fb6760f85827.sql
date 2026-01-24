-- Create student_vocabulary table for tracking Power Words
CREATE TABLE public.student_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  word TEXT NOT NULL,
  definition TEXT,
  source_story_id UUID,
  times_seen INTEGER DEFAULT 1,
  times_correct INTEGER DEFAULT 0,
  mastered BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, word)
);

-- Add RLS policies
ALTER TABLE public.student_vocabulary ENABLE ROW LEVEL SECURITY;

-- Students can view their own vocabulary
CREATE POLICY "Students can view own vocabulary"
ON public.student_vocabulary
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own vocabulary
CREATE POLICY "Students can insert own vocabulary"
ON public.student_vocabulary
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own vocabulary
CREATE POLICY "Students can update own vocabulary"
ON public.student_vocabulary
FOR UPDATE
USING (auth.uid() = student_id);

-- Create index for faster lookups
CREATE INDEX idx_student_vocabulary_student_id ON public.student_vocabulary(student_id);
CREATE INDEX idx_student_vocabulary_mastered ON public.student_vocabulary(student_id, mastered);

-- Create trigger for updated_at
CREATE TRIGGER update_student_vocabulary_updated_at
BEFORE UPDATE ON public.student_vocabulary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comprehension_score column to reading_sessions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reading_sessions' 
    AND column_name = 'comprehension_score'
  ) THEN
    ALTER TABLE public.reading_sessions 
    ADD COLUMN comprehension_score INTEGER;
  END IF;
END $$;