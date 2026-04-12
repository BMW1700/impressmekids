
-- Add enemy_type to multiplayer_rooms for level parity
ALTER TABLE public.multiplayer_rooms ADD COLUMN IF NOT EXISTS enemy_type text DEFAULT 'guard';

-- Add victory arena tracking to campaign_progress
ALTER TABLE public.campaign_progress ADD COLUMN IF NOT EXISTS victory_arena_unlocked jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.campaign_progress ADD COLUMN IF NOT EXISTS victory_arena_completions integer DEFAULT 0;
