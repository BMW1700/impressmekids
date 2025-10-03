-- Recreate the function using CREATE OR REPLACE to avoid dependency issues
CREATE OR REPLACE FUNCTION public.is_classroom_teacher(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result boolean;
BEGIN
  -- Explicitly bypass RLS by using a direct query
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE id = _classroom_id 
    AND teacher_id = _user_id
  ) INTO result;
  
  RETURN result;
END;
$$;