
-- Boss Rush Mode: Track gauntlet attempts and completions
CREATE TABLE public.boss_rush_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  current_boss_index INTEGER NOT NULL DEFAULT 0,
  bosses_defeated INTEGER NOT NULL DEFAULT 0,
  total_damage_dealt INTEGER NOT NULL DEFAULT 0,
  total_words_read INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  total_gold_earned INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_boss_rush_student ON public.boss_rush_attempts(student_id);
CREATE INDEX idx_boss_rush_status ON public.boss_rush_attempts(status);

-- Enable RLS
ALTER TABLE public.boss_rush_attempts ENABLE ROW LEVEL SECURITY;

-- Students can view their own attempts
CREATE POLICY "Students can view own boss rush attempts"
  ON public.boss_rush_attempts FOR SELECT
  USING (auth.uid() = student_id);

-- Students can insert their own attempts
CREATE POLICY "Students can insert own boss rush attempts"
  ON public.boss_rush_attempts FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own attempts
CREATE POLICY "Students can update own boss rush attempts"
  ON public.boss_rush_attempts FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view student attempts
CREATE POLICY "Teachers can view student boss rush attempts"
  ON public.boss_rush_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = boss_rush_attempts.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Add boss_rush_completions to campaign_progress for tracking best times
ALTER TABLE public.campaign_progress 
ADD COLUMN IF NOT EXISTS boss_rush_completions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boss_rush_best_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS boss_rush_unlocked BOOLEAN DEFAULT false;
