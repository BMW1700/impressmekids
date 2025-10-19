-- Fix infinite recursion in is_classroom_teacher function
-- by explicitly disabling RLS for queries within the function
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  -- Disable RLS for this function's queries to prevent infinite recursion
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = _classroom_id 
    AND teacher_id = _user_id
  ) INTO result;
  
  RETURN result;
END;
$$;