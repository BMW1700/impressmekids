ALTER TABLE public.multiplayer_rooms REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'multiplayer_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.multiplayer_rooms;
  END IF;
END $$;