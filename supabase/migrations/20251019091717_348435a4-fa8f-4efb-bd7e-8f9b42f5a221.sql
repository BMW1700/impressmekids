-- Add policy for anon role to view their own profile
-- This is safe because auth.uid() returns NULL for unauthenticated users
CREATE POLICY "Anon users can view their own profile after signin"
ON profiles FOR SELECT
TO anon
USING (auth.uid() = id);