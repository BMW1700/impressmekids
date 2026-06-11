
-- 1) Dedupe: keep highest-priority role per user
WITH ranked AS (
  SELECT ctid, user_id, role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role::text
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'district_admin' THEN 3
        WHEN 'teacher' THEN 4
        WHEN 'parent' THEN 5
        WHEN 'game_player' THEN 6
        WHEN 'student' THEN 7
        ELSE 99
      END
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked r
WHERE ur.ctid = r.ctid AND r.rn > 1;

-- 2) Drop old (user_id, role) unique if present and add unique on user_id only
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 3) Update bootstrap function to upsert (replace existing role) instead of insert
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'matthewross750@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;
