-- Create reading library table for curated story passages
CREATE TABLE public.reading_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  passage_text TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 0 AND grade_level <= 5),
  category TEXT NOT NULL CHECK (category IN ('animals', 'space', 'sports', 'fairy_tales', 'science', 'adventure', 'history')),
  target_phonemes TEXT[],
  word_count INTEGER,
  reading_time_minutes INTEGER,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  cover_gradient TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student reading progress tracking table
CREATE TABLE public.student_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.reading_library(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  best_wpm INTEGER,
  best_accuracy INTEGER,
  times_read INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, story_id)
);

-- Enable RLS on both tables
ALTER TABLE public.reading_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reading_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for reading_library: everyone can read stories
CREATE POLICY "Anyone can view reading library stories"
  ON public.reading_library
  FOR SELECT
  USING (true);

-- RLS policies for student_reading_progress: students can manage their own progress
CREATE POLICY "Students can view their own reading progress"
  ON public.student_reading_progress
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own reading progress"
  ON public.student_reading_progress
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own reading progress"
  ON public.student_reading_progress
  FOR UPDATE
  USING (student_id = auth.uid());

-- Teachers can view their students' reading progress
CREATE POLICY "Teachers can view their students' reading progress"
  ON public.student_reading_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = student_reading_progress.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_reading_library_grade_category ON public.reading_library(grade_level, category);
CREATE INDEX idx_reading_library_difficulty ON public.reading_library(difficulty_level);
CREATE INDEX idx_student_reading_progress_student ON public.student_reading_progress(student_id);
CREATE INDEX idx_student_reading_progress_story ON public.student_reading_progress(story_id);
CREATE INDEX idx_student_reading_progress_completed ON public.student_reading_progress(student_id, completed);