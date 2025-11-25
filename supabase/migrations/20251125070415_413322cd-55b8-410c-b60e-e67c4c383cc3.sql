-- Create reading achievements table
CREATE TABLE public.reading_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('first_words', 'on_fire', 'bookworm', 'sharp_shooter', 'speed_demon', 'phoneme_master', 'week_warrior', 'month_master')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reading streaks table
CREATE TABLE public.reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_reading_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reading missions table
CREATE TABLE public.reading_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily_reading', 'weekly_wpm', 'class_challenge', 'accuracy_goal')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_reading_achievements_student ON reading_achievements(student_id, earned_at DESC);
CREATE INDEX idx_reading_streaks_student ON reading_streaks(student_id);
CREATE INDEX idx_reading_missions_student_status ON reading_missions(student_id, status, expires_at);

-- Enable RLS
ALTER TABLE public.reading_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_missions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_achievements
CREATE POLICY "Students can view their own achievements"
  ON public.reading_achievements FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their students' achievements"
  ON public.reading_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = reading_achievements.student_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can insert achievements"
  ON public.reading_achievements FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for reading_streaks
CREATE POLICY "Students can view their own streaks"
  ON public.reading_streaks FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their students' streaks"
  ON public.reading_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = reading_streaks.student_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their own streaks"
  ON public.reading_streaks FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for reading_missions
CREATE POLICY "Students can view their own missions"
  ON public.reading_missions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their students' missions"
  ON public.reading_missions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = reading_missions.student_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their own missions"
  ON public.reading_missions FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);