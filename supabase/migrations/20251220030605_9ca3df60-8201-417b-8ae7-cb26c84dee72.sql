-- First drop and recreate the policy that depends on is_classroom_in_district
DROP POLICY IF EXISTS "Admins can view all classroom students" ON public.classroom_students;

CREATE POLICY "Admins can view all classroom students"
ON public.classroom_students
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Now we can drop the is_classroom_in_district function
DROP FUNCTION IF EXISTS public.is_classroom_in_district(uuid);