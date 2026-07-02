
CREATE TABLE IF NOT EXISTS public.r2_migration_status (
  id INT PRIMARY KEY DEFAULT 1,
  state TEXT NOT NULL DEFAULT 'idle',
  last_error TEXT,
  discovered INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.r2_migration_status (id, state) VALUES (1, 'idle') ON CONFLICT DO NOTHING;

GRANT SELECT ON public.r2_migration_status TO authenticated;
GRANT ALL ON public.r2_migration_status TO service_role;

ALTER TABLE public.r2_migration_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_read_r2_status"
  ON public.r2_migration_status FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
