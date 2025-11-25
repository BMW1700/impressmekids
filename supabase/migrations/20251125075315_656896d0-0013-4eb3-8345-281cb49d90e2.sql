-- Fix all tournament helper functions - remove STABLE to allow SET LOCAL

CREATE OR REPLACE FUNCTION public.is_tournament_teacher(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
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

CREATE OR REPLACE FUNCTION public.is_tournament_player(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1
    FROM tournament_players
    WHERE tournament_id = _tournament_id
      AND profile_id = _user_id
  ) INTO result;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_tournament_classroom_member(_user_id uuid, _tournament_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1
    FROM tournaments t
    JOIN classroom_students cs ON cs.classroom_id = t.classroom_id
    WHERE t.id = _tournament_id
      AND cs.student_id = _user_id
  ) INTO result;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_read_tournament_questions(_tournament_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
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