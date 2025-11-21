-- Fix security warnings by setting search_path on generate_district_code function
CREATE OR REPLACE FUNCTION generate_district_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;