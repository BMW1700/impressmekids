-- Campaign Progress: Track each student's campaign journey
CREATE TABLE public.campaign_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_world INTEGER NOT NULL DEFAULT 1,
  world_progress JSONB NOT NULL DEFAULT '{"1": [], "2": [], "3": [], "4": []}',
  total_damage_dealt INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  books_rescued INTEGER NOT NULL DEFAULT 0,
  grog_battles_won INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;

-- Students can view and update their own progress
CREATE POLICY "Students can view own campaign progress"
  ON public.campaign_progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own campaign progress"
  ON public.campaign_progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own campaign progress"
  ON public.campaign_progress FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view their students' campaign progress
CREATE POLICY "Teachers can view student campaign progress"
  ON public.campaign_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = campaign_progress.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Campaign Battle Sessions: Track individual reading battles
CREATE TABLE public.campaign_battle_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_title TEXT NOT NULL,
  story_category TEXT,
  world_number INTEGER NOT NULL DEFAULT 1,
  enemy_type TEXT NOT NULL DEFAULT 'minion',
  enemy_max_hp INTEGER NOT NULL DEFAULT 100,
  enemy_current_hp INTEGER NOT NULL DEFAULT 100,
  player_hp INTEGER NOT NULL DEFAULT 100,
  player_max_hp INTEGER NOT NULL DEFAULT 100,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  words_read INTEGER NOT NULL DEFAULT 0,
  correct_words INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  battle_status TEXT NOT NULL DEFAULT 'in_progress',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_battle_sessions ENABLE ROW LEVEL SECURITY;

-- Students can manage their own battle sessions
CREATE POLICY "Students can view own battle sessions"
  ON public.campaign_battle_sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own battle sessions"
  ON public.campaign_battle_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own battle sessions"
  ON public.campaign_battle_sessions FOR UPDATE
  USING (auth.uid() = student_id);

-- Teachers can view their students' battle sessions
CREATE POLICY "Teachers can view student battle sessions"
  ON public.campaign_battle_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE cs.student_id = campaign_battle_sessions.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Updated at trigger for campaign_progress
CREATE TRIGGER update_campaign_progress_updated_at
  BEFORE UPDATE ON public.campaign_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();