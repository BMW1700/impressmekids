DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'multiplayer_rooms' AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.multiplayer_rooms', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Block direct inserts on multiplayer rooms"
  ON public.multiplayer_rooms
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.create_multiplayer_room(text, text, text, text, integer, text, text, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.create_multiplayer_room(text, text, text, text, integer, text, text, text) TO authenticated;