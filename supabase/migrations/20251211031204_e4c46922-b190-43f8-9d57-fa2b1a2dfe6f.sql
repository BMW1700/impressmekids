-- Add coordinates to districts for accurate weather alerts
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.districts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create safety audit log table for SOC 2 compliance
CREATE TABLE IF NOT EXISTS public.safety_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  drill_session_id UUID REFERENCES public.drill_sessions(id),
  alert_id UUID REFERENCES public.safety_alerts(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on safety audit log
ALTER TABLE public.safety_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view safety audit logs
CREATE POLICY "Admins can view safety audit logs"
  ON public.safety_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert safety audit logs"
  ON public.safety_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for fast audit log queries
CREATE INDEX idx_safety_audit_log_created_at ON public.safety_audit_log(created_at DESC);
CREATE INDEX idx_safety_audit_log_event_type ON public.safety_audit_log(event_type);
CREATE INDEX idx_safety_audit_log_drill_session ON public.safety_audit_log(drill_session_id);

-- Add alert_acknowledged_at to safety_alerts for tracking
ALTER TABLE public.safety_alerts ADD COLUMN IF NOT EXISTS acknowledged_count INTEGER DEFAULT 0;

-- Create function to auto-archive expired alerts
CREATE OR REPLACE FUNCTION public.cleanup_expired_safety_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.safety_alerts
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;