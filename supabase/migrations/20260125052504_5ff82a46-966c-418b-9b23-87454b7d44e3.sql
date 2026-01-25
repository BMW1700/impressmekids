-- Create parent_stories table for private child-only stories
CREATE TABLE public.parent_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL,
  for_student_id UUID NOT NULL,
  
  -- Story content
  title TEXT NOT NULL,
  description TEXT,
  passage_text TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 8),
  category TEXT NOT NULL CHECK (category IN ('animals', 'space', 'sports', 'fairy_tales', 'science', 'adventure', 'history', 'other')),
  word_count INTEGER,
  reading_time_minutes INTEGER DEFAULT 1,
  
  -- Metadata
  source_note TEXT,
  cover_gradient TEXT DEFAULT 'from-purple-400 to-pink-500',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_stories ENABLE ROW LEVEL SECURITY;

-- Parents can insert stories for their approved children
CREATE POLICY "Parents can insert stories for their children"
  ON public.parent_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_student_links psl
      JOIN parent_accounts pa ON pa.id = psl.parent_id
      WHERE pa.user_id = auth.uid()
        AND psl.student_id = parent_stories.for_student_id
        AND psl.approved = true
    )
  );

-- Parents can view their own submissions
CREATE POLICY "Parents can view own submissions"
  ON public.parent_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_accounts pa
      WHERE pa.user_id = auth.uid()
        AND pa.user_id = parent_stories.submitted_by
    )
    OR submitted_by = auth.uid()
  );

-- Parents can update their own stories
CREATE POLICY "Parents can update own stories"
  ON public.parent_stories FOR UPDATE
  USING (submitted_by = auth.uid());

-- Parents can delete their own stories
CREATE POLICY "Parents can delete own stories"
  ON public.parent_stories FOR DELETE
  USING (submitted_by = auth.uid());

-- Students can ONLY see stories submitted FOR them
CREATE POLICY "Students can view their personal stories"
  ON public.parent_stories FOR SELECT
  USING (for_student_id = auth.uid() AND is_active = true);

-- Teachers can view stories for students in their classrooms
CREATE POLICY "Teachers can view student parent stories"
  ON public.parent_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = parent_stories.for_student_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Also expand reading_library grade constraint to support grades 6-8
ALTER TABLE public.reading_library 
  DROP CONSTRAINT IF EXISTS reading_library_grade_level_check;

ALTER TABLE public.reading_library 
  ADD CONSTRAINT reading_library_grade_level_check 
  CHECK (grade_level >= 0 AND grade_level <= 8);

-- Create index for faster lookups
CREATE INDEX idx_parent_stories_student ON public.parent_stories(for_student_id);
CREATE INDEX idx_parent_stories_submitter ON public.parent_stories(submitted_by);