-- Create helper function to check if a user is in the same district
CREATE OR REPLACE FUNCTION public.is_same_district(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p1, profiles p2
    WHERE p1.id = auth.uid()
      AND p2.id = target_user_id
      AND p1.district_id IS NOT NULL
      AND p1.district_id = p2.district_id
  );
$$;

-- Create helper function to check if a classroom is in the admin's district
CREATE OR REPLACE FUNCTION public.is_classroom_in_district(p_classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classrooms c
    JOIN profiles teacher ON teacher.id = c.teacher_id
    JOIN profiles admin ON admin.id = auth.uid()
    WHERE c.id = p_classroom_id
      AND admin.district_id IS NOT NULL
      AND teacher.district_id = admin.district_id
  );
$$;

-- Update Admins can view all classrooms - add district filtering
DROP POLICY IF EXISTS "Admins can view all classrooms" ON classrooms;
CREATE POLICY "Admins can view all classrooms"
ON classrooms FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND EXISTS (
    SELECT 1 FROM profiles teacher
    JOIN profiles admin ON admin.id = auth.uid()
    WHERE teacher.id = classrooms.teacher_id
      AND admin.district_id IS NOT NULL
      AND teacher.district_id = admin.district_id
  )
);

-- Update Admins can view all classroom students - add district filtering
DROP POLICY IF EXISTS "Admins can view all classroom students" ON classroom_students;
CREATE POLICY "Admins can view all classroom students"
ON classroom_students FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND is_classroom_in_district(classroom_id)
);

-- Update Admins can view all profiles with email - add district filtering
DROP POLICY IF EXISTS "Admins can view all profiles with email" ON profiles;
CREATE POLICY "Admins can view all profiles with email"
ON profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND is_same_district(id)
);

-- Update Admins can update profiles - add district filtering
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  AND is_same_district(id)
);

-- Update Admins can view all parent access requests - add district filtering
DROP POLICY IF EXISTS "Admins can view all parent access requests" ON parent_access_requests;
CREATE POLICY "Admins can view all parent access requests"
ON parent_access_requests FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM profiles student
    JOIN profiles admin ON admin.id = auth.uid()
    WHERE student.id = parent_access_requests.student_id
      AND admin.district_id IS NOT NULL
      AND student.district_id = admin.district_id
  )
);

-- Update Admins can update parent access requests - add district filtering
DROP POLICY IF EXISTS "Admins can update parent access requests" ON parent_access_requests;
CREATE POLICY "Admins can update parent access requests"
ON parent_access_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM profiles student
    JOIN profiles admin ON admin.id = auth.uid()
    WHERE student.id = parent_access_requests.student_id
      AND admin.district_id IS NOT NULL
      AND student.district_id = admin.district_id
  )
);