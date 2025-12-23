-- Drop broken policies that incorrectly use parent_id = auth.uid()
DROP POLICY IF EXISTS "Parents can insert their own consents" ON parent_consents;
DROP POLICY IF EXISTS "Parents can update their own consents" ON parent_consents;
DROP POLICY IF EXISTS "Parents can view their own consents" ON parent_consents;

-- Create fixed SELECT policy using proper join through parent_accounts
CREATE POLICY "Parents can view their consents" ON parent_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_accounts pa
      WHERE pa.id = parent_consents.parent_id
      AND pa.user_id = auth.uid()
    )
  );

-- Create fixed UPDATE policy using proper join through parent_accounts
CREATE POLICY "Parents can update their consents" ON parent_consents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM parent_accounts pa
      WHERE pa.id = parent_consents.parent_id
      AND pa.user_id = auth.uid()
    )
  );