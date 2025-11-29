-- Set REPLICA IDENTITY FULL on tournament_players to include all columns in realtime events
-- This allows RLS policies to properly evaluate using tournament_id for teacher access
ALTER TABLE public.tournament_players REPLICA IDENTITY FULL;