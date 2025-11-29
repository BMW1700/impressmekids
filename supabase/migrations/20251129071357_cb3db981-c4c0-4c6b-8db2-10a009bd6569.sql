-- Create SECURITY DEFINER function to get tournament players with display info
CREATE OR REPLACE FUNCTION get_tournament_players(_tournament_id UUID)
RETURNS TABLE(
  id UUID,
  profile_id UUID,
  seed INTEGER,
  status TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    tp.id,
    tp.profile_id,
    tp.seed,
    tp.status,
    pp.display_name,
    pp.avatar_url,
    tp.created_at
  FROM tournament_players tp
  LEFT JOIN public_profiles pp ON pp.id = tp.profile_id
  WHERE tp.tournament_id = _tournament_id
  ORDER BY tp.seed NULLS LAST, tp.created_at;
END;
$$;