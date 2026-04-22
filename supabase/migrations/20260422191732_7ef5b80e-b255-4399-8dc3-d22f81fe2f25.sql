-- Create singleton app_settings table
CREATE TABLE public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  demo_gate_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Public read (gate needs to read before auth)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only Ben or admins can update
CREATE POLICY "Ben or admins can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() ->> 'email') = 'benmaxweiner@gmail.com'
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (SELECT auth.jwt() ->> 'email') = 'benmaxweiner@gmail.com'
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed singleton row
INSERT INTO public.app_settings (id, demo_gate_enabled) VALUES (1, true);

-- Enable realtime
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;