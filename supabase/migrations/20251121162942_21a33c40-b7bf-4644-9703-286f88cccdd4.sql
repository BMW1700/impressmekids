-- Phase 1: Add District Manager Role to System

-- 1.1 Add district_manager to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'district_manager') THEN
    ALTER TYPE app_role ADD VALUE 'district_manager';
  END IF;
END $$;

-- 1.2 Create district_managers table (NO district_id or district_name - key requirement)
CREATE TABLE IF NOT EXISTS public.district_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.district_managers ENABLE ROW LEVEL SECURITY;

-- 1.3 RLS Policies for district_managers
CREATE POLICY "District managers can view own record"
ON public.district_managers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can insert district managers"
ON public.district_managers
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Deny anonymous access to district managers"
ON public.district_managers
FOR ALL
TO anon
USING (false);

-- 1.4 Add unique constraint to districts.district_code (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'districts_district_code_unique'
  ) THEN
    ALTER TABLE public.districts ADD CONSTRAINT districts_district_code_unique UNIQUE (district_code);
  END IF;
END $$;

-- 1.5 Create robust unique district code generation function
CREATE OR REPLACE FUNCTION public.generate_unique_district_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempt_count INTEGER := 0;
BEGIN
  LOOP
    -- Generate random 12-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM districts WHERE district_code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
    
    -- Prevent infinite loop
    attempt_count := attempt_count + 1;
    IF attempt_count >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique district code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- 1.6 Update RLS policies for districts table
CREATE POLICY "District managers can view all districts"
ON public.districts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM district_managers
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "District managers can create districts"
ON public.districts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM district_managers
    WHERE user_id = auth.uid()
  )
);