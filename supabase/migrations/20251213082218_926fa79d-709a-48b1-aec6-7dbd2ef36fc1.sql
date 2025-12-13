-- Create teacher_journal_entries table for mood tracking and journal notes
CREATE TABLE public.teacher_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL CHECK (mood IN ('amazing', 'good', 'okay', 'stressed', 'tough')),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  note TEXT,
  gratitude TEXT,
  win_of_the_day TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on teacher_id + entry_date to allow one entry per day per teacher
CREATE UNIQUE INDEX idx_teacher_journal_unique_daily ON public.teacher_journal_entries(teacher_id, entry_date) WHERE classroom_id IS NULL;
CREATE UNIQUE INDEX idx_teacher_journal_unique_daily_classroom ON public.teacher_journal_entries(teacher_id, classroom_id, entry_date) WHERE classroom_id IS NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_teacher_journal_teacher_id ON public.teacher_journal_entries(teacher_id);
CREATE INDEX idx_teacher_journal_entry_date ON public.teacher_journal_entries(entry_date DESC);

-- Enable RLS
ALTER TABLE public.teacher_journal_entries ENABLE ROW LEVEL SECURITY;

-- Teachers can only see and manage their own journal entries
CREATE POLICY "Teachers can view their own journal entries"
  ON public.teacher_journal_entries
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own journal entries"
  ON public.teacher_journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own journal entries"
  ON public.teacher_journal_entries
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own journal entries"
  ON public.teacher_journal_entries
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Create trigger for updated_at
CREATE TRIGGER update_teacher_journal_entries_updated_at
  BEFORE UPDATE ON public.teacher_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create teacher_game_scores table for mini-game high scores
CREATE TABLE public.teacher_game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_teacher_game_scores_teacher_id ON public.teacher_game_scores(teacher_id);
CREATE INDEX idx_teacher_game_scores_game_type ON public.teacher_game_scores(game_type);
CREATE INDEX idx_teacher_game_scores_score ON public.teacher_game_scores(score DESC);

-- Enable RLS
ALTER TABLE public.teacher_game_scores ENABLE ROW LEVEL SECURITY;

-- Teachers can see all scores for leaderboard
CREATE POLICY "Anyone can view game scores"
  ON public.teacher_game_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Teachers can insert their own scores"
  ON public.teacher_game_scores
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);