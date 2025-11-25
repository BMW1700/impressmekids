-- Fix the can_read_tournament_questions function to use plpgsql with proper RLS disabling
CREATE OR REPLACE FUNCTION public.can_read_tournament_questions(_tournament_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  -- Disable RLS for this function's queries to prevent recursion
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE t.id = _tournament_id
      AND c.teacher_id = _user_id
  ) INTO result;
  
  RETURN result;
END;
$function$;