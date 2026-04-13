DROP POLICY IF EXISTS "Room participants can view multiplayer rooms" ON public.multiplayer_rooms;

CREATE POLICY "Room participants can view multiplayer rooms"
ON public.multiplayer_rooms
FOR SELECT
TO authenticated
USING (
  (status = 'waiting' AND guest_id IS NULL)
  OR auth.uid() = host_id
  OR auth.uid() = guest_id
);