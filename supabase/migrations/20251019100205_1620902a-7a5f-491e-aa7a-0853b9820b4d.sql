-- Create security definer function to get parent account
CREATE OR REPLACE FUNCTION public.get_parent_account(_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, email text, full_name text, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Disable RLS for this function's queries
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT pa.id, pa.user_id, pa.email, pa.full_name, pa.created_at
  FROM public.parent_accounts pa
  WHERE pa.user_id = _user_id;
END;
$$;

-- Create security definer function to get parent student links with child details
CREATE OR REPLACE FUNCTION public.get_parent_student_links(_user_id uuid)
RETURNS TABLE(
  link_id uuid,
  student_id uuid,
  student_name text,
  student_email text,
  student_grade integer,
  approved boolean,
  requested_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Disable RLS for this function's queries
  SET LOCAL row_security = off;
  
  RETURN QUERY
  SELECT 
    psl.id as link_id,
    psl.student_id,
    p.full_name as student_name,
    p.email as student_email,
    sp.grade as student_grade,
    psl.approved,
    psl.requested_at
  FROM public.parent_student_links psl
  JOIN public.parent_accounts pa ON pa.id = psl.parent_id
  JOIN public.profiles p ON p.id = psl.student_id
  LEFT JOIN public.student_profiles sp ON sp.user_id = psl.student_id
  WHERE pa.user_id = _user_id
  ORDER BY psl.requested_at DESC;
END;
$$;