-- Drop the old update policy
DROP POLICY "Participants can update their room" ON public.multiplayer_rooms;

-- Create two update policies:
-- 1. Allow anyone to join a waiting room (set themselves as guest)
CREATE POLICY "Anyone can join a waiting room"
ON public.multiplayer_rooms
FOR UPDATE
USING (status = 'waiting')
WITH CHECK (
  -- The joiner must set guest_id to their own uid
  guest_id = auth.uid()
  AND status = 'active'
);

-- 2. Allow existing participants to update game state
CREATE POLICY "Participants can update their room"
ON public.multiplayer_rooms
FOR UPDATE
USING (auth.uid() = host_id OR auth.uid() = guest_id)
WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);