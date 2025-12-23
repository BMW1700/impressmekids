-- Drop and recreate get_parent_children with updated return type
DROP FUNCTION IF EXISTS public.get_parent_children(uuid);

CREATE OR REPLACE FUNCTION public.get_parent_children(_user_id uuid)
RETURNS TABLE(
  student_id uuid,
  full_name text,
  email text,
  grade integer,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.full_name,
    p.email,
    pp.grade,
    pp.avatar_url
  FROM profiles p
  JOIN parent_student_links psl ON psl.student_id = p.id
  JOIN parent_accounts pa ON pa.id = psl.parent_id
  LEFT JOIN public_profiles pp ON pp.id = p.id
  WHERE pa.user_id = _user_id
    AND psl.approved = true
  ORDER BY p.full_name;
END;
$$;