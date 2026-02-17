
-- Create deletion request status enum
CREATE TYPE public.deletion_request_status AS ENUM ('pending', 'approved', 'denied', 'completed');

-- Create data_deletion_requests table
CREATE TABLE public.data_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  status public.deletion_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Parents can insert requests for their own children
CREATE POLICY "Parents can create deletion requests for their children"
ON public.data_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (
  parent_id = public.get_parent_id(auth.uid())
  AND public.is_parent_of_student(auth.uid(), student_id)
);

-- Parents can view their own requests
CREATE POLICY "Parents can view their own deletion requests"
ON public.data_deletion_requests
FOR SELECT
TO authenticated
USING (
  parent_id = public.get_parent_id(auth.uid())
);

-- Admins can view all requests
CREATE POLICY "Admins can view all deletion requests"
ON public.data_deletion_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update deletion requests"
ON public.data_deletion_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Add index for performance
CREATE INDEX idx_data_deletion_requests_status ON public.data_deletion_requests(status);
CREATE INDEX idx_data_deletion_requests_parent_id ON public.data_deletion_requests(parent_id);
