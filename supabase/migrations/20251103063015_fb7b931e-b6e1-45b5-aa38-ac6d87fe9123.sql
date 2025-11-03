-- Create RPC functions for directory access (teachers and parents can view)

-- Function to get all teachers for directory
CREATE OR REPLACE FUNCTION public.get_directory_teachers()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email
  FROM profiles p
  WHERE p.role = 'teacher'
  ORDER BY p.full_name;
$$;

-- Function to get all admins for directory
CREATE OR REPLACE FUNCTION public.get_directory_admins()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.email
  FROM profiles p
  WHERE p.role = 'admin'
  ORDER BY p.full_name;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_directory_teachers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_directory_admins() TO authenticated;