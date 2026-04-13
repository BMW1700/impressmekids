DROP POLICY IF EXISTS "Anyone can join a waiting room" ON public.multiplayer_rooms;
DROP POLICY IF EXISTS "Participants can update their room" ON public.multiplayer_rooms;
DROP POLICY IF EXISTS "Room participants can update multiplayer rooms" ON public.multiplayer_rooms;

CREATE POLICY "Anyone can join a waiting room"
ON public.multiplayer_rooms
FOR UPDATE
TO authenticated
USING (status = 'waiting' AND guest_id IS NULL)
WITH CHECK (
  guest_id = auth.uid()
  AND status = 'active'
);

CREATE POLICY "Participants can update active multiplayer rooms"
ON public.multiplayer_rooms
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = host_id OR auth.uid() = guest_id)
  AND status IN ('active', 'completed', 'waiting')
)
WITH CHECK (
  auth.uid() = host_id OR auth.uid() = guest_id
);

CREATE OR REPLACE FUNCTION public.sync_multiplayer_room_state(
  p_room_id uuid,
  p_game_state jsonb,
  p_status text DEFAULT NULL
)
RETURNS TABLE(updated_at timestamptz, status text, game_state jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.multiplayer_rooms mr
    WHERE mr.id = p_room_id
      AND (mr.host_id = v_user_id OR mr.guest_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not allowed to update this room';
  END IF;

  RETURN QUERY
  UPDATE public.multiplayer_rooms mr
  SET
    game_state = COALESCE(p_game_state, mr.game_state),
    status = COALESCE(p_status, mr.status),
    updated_at = now()
  WHERE mr.id = p_room_id
  RETURNING mr.updated_at, mr.status, mr.game_state;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_multiplayer_room_state(uuid, jsonb, text) TO authenticated;