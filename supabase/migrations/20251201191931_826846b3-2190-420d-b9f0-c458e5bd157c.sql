-- ============================================
-- BEHAVIOR TRACKING SYSTEM TABLES
-- ============================================

-- Create behavior categories table
CREATE TABLE IF NOT EXISTS public.behavior_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  point_value INTEGER NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('positive', 'negative')),
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create behavior records table
CREATE TABLE IF NOT EXISTS public.behavior_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.behavior_categories(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create student behavior stats table
CREATE TABLE IF NOT EXISTS public.student_behavior_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  weekly_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_positive_date DATE,
  week_start_date DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, classroom_id)
);

-- Create indexes for behavior tables
CREATE INDEX IF NOT EXISTS idx_behavior_categories_classroom ON public.behavior_categories(classroom_id);
CREATE INDEX IF NOT EXISTS idx_behavior_records_student ON public.behavior_records(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_records_classroom ON public.behavior_records(classroom_id);
CREATE INDEX IF NOT EXISTS idx_behavior_records_created ON public.behavior_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_stats_student ON public.student_behavior_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_stats_classroom ON public.student_behavior_stats(classroom_id);

-- Enable RLS
ALTER TABLE public.behavior_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_behavior_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for behavior_categories
CREATE POLICY "Teachers can manage categories in their classrooms"
  ON public.behavior_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = behavior_categories.classroom_id
      AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = behavior_categories.classroom_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view categories in their classrooms"
  ON public.behavior_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classroom_students
      WHERE classroom_id = behavior_categories.classroom_id
      AND student_id = auth.uid()
    )
  );

-- RLS Policies for behavior_records
CREATE POLICY "Teachers can manage behavior records in their classrooms"
  ON public.behavior_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = behavior_records.classroom_id
      AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = behavior_records.classroom_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own behavior records"
  ON public.behavior_records
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Parents can view their children's behavior records"
  ON public.behavior_records
  FOR SELECT
  USING (
    student_id IN (
      SELECT psl.student_id
      FROM public.parent_student_links psl
      JOIN public.parent_accounts pa ON pa.id = psl.parent_id
      WHERE pa.user_id = auth.uid()
      AND psl.approved = true
    )
  );

-- RLS Policies for student_behavior_stats
CREATE POLICY "Teachers can view stats in their classrooms"
  ON public.student_behavior_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = student_behavior_stats.classroom_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update stats in their classrooms"
  ON public.student_behavior_stats
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms
      WHERE id = student_behavior_stats.classroom_id
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own stats"
  ON public.student_behavior_stats
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Parents can view their children's stats"
  ON public.student_behavior_stats
  FOR SELECT
  USING (
    student_id IN (
      SELECT psl.student_id
      FROM public.parent_student_links psl
      JOIN public.parent_accounts pa ON pa.id = psl.parent_id
      WHERE pa.user_id = auth.uid()
      AND psl.approved = true
    )
  );

CREATE POLICY "System can insert stats"
  ON public.student_behavior_stats
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ANTI-CHEATING COLUMNS FOR ASSIGNMENTS
-- ============================================

-- Add anti-cheating configuration columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shuffle_answers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS isolation_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS focus_detection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS time_per_question_seconds INTEGER;

-- Add focus violations tracking to assignment_submissions
ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS focus_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS anti_cheating_metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Function to update behavior stats when a record is added
CREATE OR REPLACE FUNCTION public.update_behavior_stats()
RETURNS TRIGGER AS $$
DECLARE
  current_week_start DATE;
  last_positive DATE;
  streak_count INTEGER;
BEGIN
  current_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  
  -- Insert or update stats
  INSERT INTO public.student_behavior_stats (
    student_id,
    classroom_id,
    total_points,
    weekly_points,
    current_streak,
    last_positive_date,
    week_start_date
  )
  VALUES (
    NEW.student_id,
    NEW.classroom_id,
    NEW.points,
    CASE WHEN current_week_start = date_trunc('week', NEW.created_at)::DATE THEN NEW.points ELSE 0 END,
    CASE WHEN NEW.points > 0 THEN 1 ELSE 0 END,
    CASE WHEN NEW.points > 0 THEN NEW.created_at::DATE ELSE NULL END,
    current_week_start
  )
  ON CONFLICT (student_id, classroom_id)
  DO UPDATE SET
    total_points = student_behavior_stats.total_points + NEW.points,
    weekly_points = CASE
      WHEN student_behavior_stats.week_start_date = current_week_start
      THEN student_behavior_stats.weekly_points + NEW.points
      ELSE NEW.points
    END,
    week_start_date = current_week_start,
    current_streak = CASE
      WHEN NEW.points > 0 THEN
        CASE
          WHEN student_behavior_stats.last_positive_date = CURRENT_DATE - INTERVAL '1 day'
          THEN student_behavior_stats.current_streak + 1
          WHEN student_behavior_stats.last_positive_date = CURRENT_DATE
          THEN student_behavior_stats.current_streak
          ELSE 1
        END
      ELSE student_behavior_stats.current_streak
    END,
    best_streak = CASE
      WHEN NEW.points > 0 THEN
        GREATEST(
          student_behavior_stats.best_streak,
          CASE
            WHEN student_behavior_stats.last_positive_date = CURRENT_DATE - INTERVAL '1 day'
            THEN student_behavior_stats.current_streak + 1
            WHEN student_behavior_stats.last_positive_date = CURRENT_DATE
            THEN student_behavior_stats.current_streak
            ELSE 1
          END
        )
      ELSE student_behavior_stats.best_streak
    END,
    last_positive_date = CASE
      WHEN NEW.points > 0 THEN NEW.created_at::DATE
      ELSE student_behavior_stats.last_positive_date
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for behavior stats updates
DROP TRIGGER IF EXISTS update_behavior_stats_trigger ON public.behavior_records;
CREATE TRIGGER update_behavior_stats_trigger
  AFTER INSERT ON public.behavior_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_behavior_stats();

-- Function to seed default behavior categories for a classroom
CREATE OR REPLACE FUNCTION public.seed_default_behavior_categories(p_classroom_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.behavior_categories (classroom_id, name, point_value, category_type, icon, color, is_default)
  VALUES
    (p_classroom_id, 'Helpful', 5, 'positive', '🤝', 'green', true),
    (p_classroom_id, 'On-Task', 3, 'positive', '✅', 'blue', true),
    (p_classroom_id, 'Participation', 5, 'positive', '🙋', 'purple', true),
    (p_classroom_id, 'Leadership', 10, 'positive', '⭐', 'yellow', true),
    (p_classroom_id, 'Kindness', 5, 'positive', '💚', 'green', true),
    (p_classroom_id, 'Disruptive', -5, 'negative', '⚠️', 'red', true),
    (p_classroom_id, 'Late', -3, 'negative', '⏰', 'orange', true),
    (p_classroom_id, 'Off-Task', -3, 'negative', '❌', 'red', true),
    (p_classroom_id, 'Missing Work', -5, 'negative', '📝', 'orange', true),
    (p_classroom_id, 'Unprepared', -3, 'negative', '🎒', 'orange', true)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;