-- Create pending teacher requests table
CREATE TABLE public.pending_teacher_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pending_teacher_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own teacher requests"
ON public.pending_teacher_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create teacher requests"
ON public.pending_teacher_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all teacher requests"
ON public.pending_teacher_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update teacher requests"
ON public.pending_teacher_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));