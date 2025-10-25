-- Fix RLS policies for parent_access_requests to use authenticated role instead of public
-- The 'public' role only applies to unauthenticated users, not authenticated ones

DROP POLICY IF EXISTS "Parents can view their own requests" ON public.parent_access_requests;

CREATE POLICY "Parents can view their own requests"
ON public.parent_access_requests
FOR SELECT
TO authenticated
USING (parent_id = get_parent_id(auth.uid()));

DROP POLICY IF EXISTS "Parents can create their own requests" ON public.parent_access_requests;

CREATE POLICY "Parents can create their own requests"
ON public.parent_access_requests
FOR INSERT
TO authenticated
WITH CHECK (parent_id = get_parent_id(auth.uid()));