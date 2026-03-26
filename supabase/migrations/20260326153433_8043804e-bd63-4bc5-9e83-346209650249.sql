
-- Fix remaining game table policies (old policy names we missed)
DROP POLICY IF EXISTS "System can create game rounds" ON public.game_rounds;
DROP POLICY IF EXISTS "System can update game players" ON public.game_players;

-- Fix security_summary view - restrict to admin only
ALTER VIEW IF EXISTS public.security_summary SET (security_invoker = true);
-- If it's a view, add RLS won't work directly. Drop and recreate or just ensure it's admin-only.
-- Actually views don't support RLS directly. Let's check if it's a table or view.
