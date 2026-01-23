-- =====================================================
-- RPG ADDICTION LAYER: Daily Rewards, Achievements, Pets
-- =====================================================

-- 1. Daily Login Rewards Table
CREATE TABLE public.daily_login_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_day INTEGER NOT NULL DEFAULT 1,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  bonus_reward JSONB DEFAULT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, login_date)
);

-- 2. Player Achievements Table
CREATE TABLE public.player_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  achievement_category TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(student_id, achievement_id)
);

-- 3. Player Pets Table
CREATE TABLE public.player_pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_type TEXT NOT NULL,
  pet_name TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  last_fed_at TIMESTAMP WITH TIME ZONE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, pet_type)
);

-- 4. Player Equipped Items Table
CREATE TABLE public.player_equipped_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  equipped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, slot_type)
);

-- 5. Weekly Challenges Table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  reward_gold INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, challenge_type, week_start)
);

-- 6. Extend campaign_progress with streak fields
ALTER TABLE public.campaign_progress 
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS equipped_pet_id UUID REFERENCES public.player_pets(id),
ADD COLUMN IF NOT EXISTS total_gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_achievements INTEGER DEFAULT 0;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Daily Login Rewards
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login rewards"
ON public.daily_login_rewards FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own login rewards"
ON public.daily_login_rewards FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Player Achievements
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
ON public.player_achievements FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own achievements"
ON public.player_achievements FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Player Pets
ALTER TABLE public.player_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pets"
ON public.player_pets FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own pets"
ON public.player_pets FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own pets"
ON public.player_pets FOR UPDATE
USING (auth.uid() = student_id);

-- Player Equipped Items
ALTER TABLE public.player_equipped_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own equipped items"
ON public.player_equipped_items FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can manage their own equipped items"
ON public.player_equipped_items FOR ALL
USING (auth.uid() = student_id);

-- Weekly Challenges
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly challenges"
ON public.weekly_challenges FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own weekly challenges"
ON public.weekly_challenges FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own weekly challenges"
ON public.weekly_challenges FOR UPDATE
USING (auth.uid() = student_id);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_daily_login_rewards_student ON public.daily_login_rewards(student_id);
CREATE INDEX idx_daily_login_rewards_date ON public.daily_login_rewards(login_date);
CREATE INDEX idx_player_achievements_student ON public.player_achievements(student_id);
CREATE INDEX idx_player_achievements_category ON public.player_achievements(achievement_category);
CREATE INDEX idx_player_pets_student ON public.player_pets(student_id);
CREATE INDEX idx_player_pets_equipped ON public.player_pets(student_id, is_equipped);
CREATE INDEX idx_weekly_challenges_student_week ON public.weekly_challenges(student_id, week_start);