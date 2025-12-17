-- Drop existing policies
DROP POLICY IF EXISTS "District admins can view district requests" ON account_verification_requests;
DROP POLICY IF EXISTS "District admins can update district requests" ON account_verification_requests;

-- Create new SELECT policy: Platform admins OR district admins OR own requests
CREATE POLICY "Admins can view verification requests" 
ON account_verification_requests FOR SELECT TO authenticated
USING (
  -- Platform-wide admins can see all
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- District admins can see their district's requests
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid() AND da.district_name = account_verification_requests.district_name
  )
  OR
  -- Users can see their own requests
  user_id = auth.uid()
);

-- Create new UPDATE policy
CREATE POLICY "Admins can update verification requests"
ON account_verification_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid() AND da.district_name = account_verification_requests.district_name
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid() AND da.district_name = account_verification_requests.district_name
  )
);