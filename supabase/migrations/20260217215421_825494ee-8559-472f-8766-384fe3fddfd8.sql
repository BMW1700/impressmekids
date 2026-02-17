-- Secure user_roles table
DROP POLICY IF EXISTS "Enable all access for all users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow insert for all authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow update for all authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Allow delete for all authenticated users" ON public.user_roles;

-- Create admin-only policy
CREATE POLICY "Only admins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to read their own roles (important for client-side role checks)
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
