CREATE OR REPLACE FUNCTION public.sync_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'parent'::user_role THEN
      RETURN NEW;
    END IF;

    DELETE FROM public.user_roles WHERE user_id = NEW.id;

    -- user_roles is UNIQUE (user_id): the conflict target must be (user_id).
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      CASE NEW.role
        WHEN 'teacher'::user_role THEN 'teacher'::app_role
        WHEN 'student'::user_role THEN 'student'::app_role
        WHEN 'admin'::user_role THEN 'admin'::app_role
        WHEN 'game_player'::user_role THEN 'game_player'::app_role
        WHEN 'district_admin'::user_role THEN 'district_manager'::app_role
        ELSE 'student'::app_role
      END
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;