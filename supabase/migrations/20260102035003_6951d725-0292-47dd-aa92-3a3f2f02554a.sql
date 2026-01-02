-- Fix linter: ensure public view uses invoker privileges
DO $$
BEGIN
  -- If the view exists, make it security-invoker so it does not run with definer privileges
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
      AND c.relname = 'security_summary'
  ) THEN
    EXECUTE 'ALTER VIEW public.security_summary SET (security_invoker=true)';
  END IF;
END
$$;

-- Provide safe access to display names for a club (avoids exposing full profiles via RLS)
CREATE OR REPLACE FUNCTION public.get_club_profile_names(club_id uuid)
RETURNS TABLE(profile_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id AS profile_id, p.full_name
  FROM public.profiles p
  WHERE p.id IN (
    SELECT c.owner_id
    FROM public.clubs c
    WHERE c.id = club_id

    UNION

    SELECT cp.created_by
    FROM public.club_posts cp
    WHERE cp.club_id = club_id
  );
$$;

REVOKE ALL ON FUNCTION public.get_club_profile_names(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_profile_names(uuid) TO authenticated;