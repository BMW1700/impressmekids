DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'multiplayer_rooms'
      AND policyname = 'Users can update their own multiplayer rooms'
  ) THEN
    DROP POLICY "Users can update their own multiplayer rooms" ON public.multiplayer_rooms;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'multiplayer_rooms'
      AND policyname = 'Users can view waiting rooms or rooms they joined'
  ) THEN
    DROP POLICY "Users can view waiting rooms or rooms they joined" ON public.multiplayer_rooms;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'multiplayer_rooms'
      AND policyname = 'Users can create multiplayer rooms'
  ) THEN
    DROP POLICY "Users can create multiplayer rooms" ON public.multiplayer_rooms;
  END IF;
END $$;

CREATE POLICY "Room participants can view multiplayer rooms"
ON public.multiplayer_rooms
FOR SELECT
TO authenticated
USING (
  status = 'waiting'
  OR auth.uid() = host_id
  OR auth.uid() = guest_id
);

CREATE POLICY "Users can create their multiplayer rooms"
ON public.multiplayer_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

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
  OR auth.uid() = guest_id
);

CREATE POLICY "Room participants can delete multiplayer rooms"
ON public.multiplayer_rooms
FOR DELETE
TO authenticated
USING (
  auth.uid() = host_id
  OR auth.uid() = guest_id
);