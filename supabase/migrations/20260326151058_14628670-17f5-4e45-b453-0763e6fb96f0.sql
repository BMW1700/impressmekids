-- Fix schools INSERT tautology (p.district_id = p.district_id -> p.district_id = schools.district_id)
DROP POLICY IF EXISTS "Admins can create schools in their district" ON public.schools;

CREATE POLICY "Admins can create schools in their district"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.district_id = schools.district_id
  ))
  OR
  (EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM districts d
        WHERE d.district_code = schools.district_id
          AND d.name = da.district_name
      )
  ))
);