CREATE TABLE public.super_admin_grants (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_role public.app_role,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.super_admin_grants TO authenticated;
GRANT ALL ON public.super_admin_grants TO service_role;

ALTER TABLE public.super_admin_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view grants"
ON public.super_admin_grants FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));