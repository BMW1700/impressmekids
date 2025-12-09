-- Create SECURITY DEFINER function to get parent's approved children with profile info
CREATE OR REPLACE FUNCTION public.get_parent_children(_parent_user_id uuid)
RETURNS TABLE(
  link_id uuid,
  student_id uuid,
  full_name text,
  email text,
  grade integer,
  avatar_url text,
  approved boolean,
  approved_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the calling user matches the parent_user_id for security
  IF auth.uid() != _parent_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other parent data';
  END IF;

  RETURN QUERY
  SELECT 
    psl.id as link_id,
    psl.student_id,
    p.full_name,
    p.email,
    pp.grade,
    pp.avatar_url,
    psl.approved,
    psl.approved_at
  FROM parent_student_links psl
  JOIN parent_accounts pa ON pa.id = psl.parent_id
  JOIN profiles p ON p.id = psl.student_id
  LEFT JOIN public_profiles pp ON pp.id = psl.student_id
  WHERE pa.user_id = _parent_user_id
    AND psl.approved = true
  ORDER BY p.full_name;
END;
$$;