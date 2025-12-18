-- Recreate function without STABLE (defaults to VOLATILE which allows SET commands)
CREATE OR REPLACE FUNCTION public.get_user_district_id(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN (
    SELECT district_id 
    FROM public.profiles 
    WHERE id = _user_id
    LIMIT 1
  );
END;
$$;