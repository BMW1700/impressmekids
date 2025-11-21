-- Phase 1: Add 12-digit district codes to districts table
ALTER TABLE districts ADD COLUMN IF NOT EXISTS district_code TEXT UNIQUE;

-- Create function to generate 12-digit codes
CREATE OR REPLACE FUNCTION generate_district_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 12-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM districts WHERE district_code = code) INTO code_exists;
    
    IF NOT code_exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate codes for existing districts
UPDATE districts SET district_code = generate_district_code() WHERE district_code IS NULL;

-- Make district_code required
ALTER TABLE districts ALTER COLUMN district_code SET NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(district_code);

-- Phase 2: Add district_name and is_verified to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Backfill district_name for existing profiles
UPDATE profiles p
SET district_name = d.name
FROM districts d
WHERE p.district_id = d.id AND p.district_name IS NULL;

-- Auto-verify all existing accounts (grandfather them in)
UPDATE profiles SET is_verified = TRUE WHERE created_at < NOW() AND is_verified = FALSE;

-- Create index for verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON profiles(is_verified) WHERE is_verified = FALSE;

-- Phase 3: Create universal account verification system
CREATE TABLE IF NOT EXISTS account_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  district_code TEXT NOT NULL,
  district_name TEXT NOT NULL,
  
  -- User details
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('teacher', 'student', 'parent')),
  
  -- Request tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  denial_reason TEXT,
  
  UNIQUE(user_id)
);

-- Enable RLS on account_verification_requests
ALTER TABLE account_verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests"
ON account_verification_requests FOR SELECT
USING (user_id = auth.uid());

-- District admins can view requests for their district
CREATE POLICY "District admins can view district requests"
ON account_verification_requests FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  district_id IN (
    SELECT district_id FROM profiles 
    WHERE id = auth.uid() 
    AND is_verified = true
  )
);

-- District admins can update requests in their district
CREATE POLICY "District admins can update district requests"
ON account_verification_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  district_id IN (
    SELECT district_id FROM profiles 
    WHERE id = auth.uid()
    AND is_verified = true
  )
);

-- System can insert verification requests
CREATE POLICY "System can create verification requests"
ON account_verification_requests FOR INSERT
WITH CHECK (true);

-- Create index for pending requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_pending 
ON account_verification_requests(district_id, status) 
WHERE status = 'pending';