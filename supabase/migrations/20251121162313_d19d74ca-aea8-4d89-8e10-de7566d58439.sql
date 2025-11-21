-- Remove redundant district_code column from account_verification_requests
-- The district_code can be retrieved via JOIN with districts table using district_id

ALTER TABLE public.account_verification_requests 
DROP COLUMN IF EXISTS district_code;