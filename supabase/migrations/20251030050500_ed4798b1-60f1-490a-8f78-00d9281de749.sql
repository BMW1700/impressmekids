-- Create data restoration requests table
CREATE TABLE public.data_restoration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES public.cold_storage_backups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Request details
  backup_name TEXT NOT NULL,
  backup_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  
  -- School/district info
  school_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  review_notes TEXT,
  
  -- Metadata
  tables_requested TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_restoration_requests ENABLE ROW LEVEL SECURITY;

-- Admins can create restoration requests
CREATE POLICY "Admins can create restoration requests"
  ON public.data_restoration_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view their own restoration requests
CREATE POLICY "Admins can view their own restoration requests"
  ON public.data_restoration_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can cancel their own pending requests
CREATE POLICY "Admins can cancel their own pending requests"
  ON public.data_restoration_requests
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    AND status = 'pending'
    AND requested_by = auth.uid()
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- Create indexes
CREATE INDEX idx_restoration_requests_status ON public.data_restoration_requests(status);
CREATE INDEX idx_restoration_requests_requested_by ON public.data_restoration_requests(requested_by);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_restoration_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_restoration_request_updated_at
  BEFORE UPDATE ON public.data_restoration_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_restoration_request_updated_at();

-- Log restoration requests to backup_audit_log
CREATE OR REPLACE FUNCTION log_restoration_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.backup_audit_log (
    backup_id,
    action_type,
    performed_by,
    action_details,
    status
  ) VALUES (
    NEW.backup_id,
    'REQUEST_RESTORATION',
    NEW.requested_by,
    jsonb_build_object(
      'reason', NEW.reason,
      'urgency', NEW.urgency,
      'contact_email', NEW.contact_email,
      'tables_requested', NEW.tables_requested
    ),
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_restoration_request
  AFTER INSERT ON public.data_restoration_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_restoration_request();