
-- Drop the overly permissive policy
DROP POLICY "Participants can read their room" ON public.multiplayer_rooms;

-- Participants always see their room
CREATE POLICY "Participants can read own room"
  ON public.multiplayer_rooms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Others can only look up waiting rooms by code (for joining)
CREATE POLICY "Users can find waiting rooms"
  ON public.multiplayer_rooms
  FOR SELECT
  TO authenticated
  USING (status = 'waiting');
