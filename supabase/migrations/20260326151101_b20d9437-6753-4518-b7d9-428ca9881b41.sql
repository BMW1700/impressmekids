-- Fix parent profile view - require approved status
CREATE OR REPLACE FUNCTION public.can_parent_view_student_profile(_user_id uuid, _student_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
 SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_access_requests par
    JOIN public.parent_accounts pa ON pa.id = par.parent_id
    WHERE pa.user_id = _user_id
      AND par.student_id = _student_id
      AND par.status = 'approved'
  );
$$;