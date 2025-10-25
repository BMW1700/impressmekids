-- Add RLS policy for admins to view parent accounts
CREATE POLICY "Admins can view all parent accounts"
ON public.parent_accounts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));