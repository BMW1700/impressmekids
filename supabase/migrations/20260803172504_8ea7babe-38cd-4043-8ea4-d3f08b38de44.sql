-- 1. Challenge Meter: fix parent policy (must join through parent_accounts)
DROP POLICY IF EXISTS "parents manage linked child challenge settings" ON public.challenge_settings;

CREATE POLICY "parents manage linked child challenge settings"
ON public.challenge_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = challenge_settings.student_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
      AND psl.student_id = challenge_settings.student_id
  )
);

-- 2. Challenge Meter: students may create/update their own row
CREATE POLICY "students insert own challenge settings"
ON public.challenge_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "students update own challenge settings"
ON public.challenge_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- 3. Safe self-service initial role claim (never privileged roles)
CREATE OR REPLACE FUNCTION public.claim_initial_role(_role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  -- Only non-privileged self-service roles may be claimed.
  IF _role NOT IN ('student'::app_role, 'teacher'::app_role, 'parent'::app_role, 'game_player'::app_role) THEN
    RETURN false;
  END IF;

  -- Never overwrite or add to an existing role assignment.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_initial_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_initial_role(public.app_role) TO authenticated, service_role;