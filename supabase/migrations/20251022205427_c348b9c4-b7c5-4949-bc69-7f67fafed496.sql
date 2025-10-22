-- Server-side AURA audit logging function
-- This creates an immutable audit trail for COPPA compliance

CREATE TABLE IF NOT EXISTS public.aura_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  accessed_student UUID NOT NULL,
  record_id UUID,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'create', 'update', 'list')),
  access_context TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.aura_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.aura_access_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Function to log AURA record access
CREATE OR REPLACE FUNCTION public.log_aura_access(
  p_student_id UUID,
  p_record_id UUID,
  p_access_type TEXT,
  p_access_context TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.aura_access_log (
    accessed_by,
    accessed_student,
    record_id,
    access_type,
    access_context,
    created_at
  ) VALUES (
    auth.uid(),
    p_student_id,
    p_record_id,
    p_access_type,
    p_access_context,
    now()
  );
END;
$$;

-- Add index for performance
CREATE INDEX idx_aura_access_log_student ON public.aura_access_log(accessed_student, created_at DESC);
CREATE INDEX idx_aura_access_log_accessor ON public.aura_access_log(accessed_by, created_at DESC);