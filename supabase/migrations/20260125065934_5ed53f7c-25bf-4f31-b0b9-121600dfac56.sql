-- Create reading_duels table for turn-based PvP challenges
CREATE TABLE public.reading_duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL,
  opponent_id UUID,
  passage_text TEXT NOT NULL,
  passage_title TEXT NOT NULL,
  passage_word_count INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'in_progress', 'completed', 'expired', 'declined')),
  
  -- Challenger stats
  challenger_words_read INTEGER DEFAULT 0,
  challenger_accuracy NUMERIC(5,2) DEFAULT 0,
  challenger_time_seconds INTEGER,
  challenger_best_streak INTEGER DEFAULT 0,
  challenger_score INTEGER DEFAULT 0,
  challenger_completed_at TIMESTAMPTZ,
  
  -- Opponent stats
  opponent_words_read INTEGER DEFAULT 0,
  opponent_accuracy NUMERIC(5,2) DEFAULT 0,
  opponent_time_seconds INTEGER,
  opponent_best_streak INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  opponent_completed_at TIMESTAMPTZ,
  
  -- Results
  winner_id UUID,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create duel_stats table for aggregate tracking
CREATE TABLE public.duel_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE,
  total_duels INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  total_xp_from_duels INTEGER DEFAULT 0,
  total_gold_from_duels INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duel_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_duels
CREATE POLICY "Students can view duels in their classrooms"
ON public.reading_duels FOR SELECT
USING (
  classroom_id IN (
    SELECT classroom_id FROM public.classroom_students WHERE student_id = auth.uid()
  )
  OR challenger_id = auth.uid()
  OR opponent_id = auth.uid()
);

CREATE POLICY "Students can create duels"
ON public.reading_duels FOR INSERT
WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Duel participants can update their duels"
ON public.reading_duels FOR UPDATE
USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- RLS Policies for duel_stats
CREATE POLICY "Students can view their own duel stats"
ON public.duel_stats FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own duel stats"
ON public.duel_stats FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own duel stats"
ON public.duel_stats FOR UPDATE
USING (student_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_reading_duels_classroom ON public.reading_duels(classroom_id);
CREATE INDEX idx_reading_duels_challenger ON public.reading_duels(challenger_id);
CREATE INDEX idx_reading_duels_opponent ON public.reading_duels(opponent_id);
CREATE INDEX idx_reading_duels_status ON public.reading_duels(status);
CREATE INDEX idx_duel_stats_student ON public.duel_stats(student_id);

-- Trigger for updated_at
CREATE TRIGGER update_reading_duels_updated_at
BEFORE UPDATE ON public.reading_duels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_duel_stats_updated_at
BEFORE UPDATE ON public.duel_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();