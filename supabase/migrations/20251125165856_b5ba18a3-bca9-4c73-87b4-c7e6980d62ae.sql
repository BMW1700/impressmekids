-- Fix can_parent_view_classroom function - remove STABLE to allow SET LOCAL

CREATE OR REPLACE FUNCTION public.can_parent_view_classroom(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  SET LOCAL row_security = off;
  
  RETURN EXISTS (
    SELECT 1
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = _user_id
      AND psl.approved = true
      AND cs.classroom_id = _classroom_id
  );
END;
$function$;