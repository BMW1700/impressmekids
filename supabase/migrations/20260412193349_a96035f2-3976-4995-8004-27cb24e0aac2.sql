
-- Create multiplayer rooms table
CREATE TABLE public.multiplayer_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'pvp',
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL DEFAULT 'Player 1',
  guest_name TEXT NOT NULL DEFAULT 'Player 2',
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  story_passage TEXT NOT NULL DEFAULT '',
  story_title TEXT NOT NULL DEFAULT '',
  world_number INTEGER NOT NULL DEFAULT 1,
  grade_mode TEXT NOT NULL DEFAULT 'k5',
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can create a room
CREATE POLICY "Users can create rooms"
  ON public.multiplayer_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- Participants can read their own room
CREATE POLICY "Participants can read their room"
  ON public.multiplayer_rooms
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = host_id 
    OR auth.uid() = guest_id
    OR status = 'waiting'
  );

-- Participants can update their room
CREATE POLICY "Participants can update their room"
  ON public.multiplayer_rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id)
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);

-- Auto-update updated_at
CREATE TRIGGER update_multiplayer_rooms_updated_at
  BEFORE UPDATE ON public.multiplayer_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_rooms;
