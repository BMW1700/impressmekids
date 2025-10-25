-- Fix parent_accounts policies to use authenticated role
DROP POLICY IF EXISTS "Parents can insert their own account" ON public.parent_accounts;
CREATE POLICY "Parents can insert their own account"
ON public.parent_accounts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update their own account" ON public.parent_accounts;
CREATE POLICY "Parents can update their own account"
ON public.parent_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view their own account" ON public.parent_accounts;
CREATE POLICY "Parents can view their own account"
ON public.parent_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());