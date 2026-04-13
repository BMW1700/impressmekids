DROP POLICY IF EXISTS "Room participants can update multiplayer rooms" ON public.multiplayer_rooms;

CREATE POLICY "Room participants can update multiplayer rooms"
ON public.multiplayer_rooms
FOR UPDATE
TO authenticated
USING (
  auth.uid() = host_id
  OR auth.uid() = guest_id
)
WITH CHECK (
  auth.uid() = host_id
  OR auth.uid() = host_id
  OR auth.uid() = guest_id
);