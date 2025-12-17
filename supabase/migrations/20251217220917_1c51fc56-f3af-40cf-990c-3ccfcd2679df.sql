-- Add columns to store signup data for auto-account creation on consent verification
ALTER TABLE public.student_signup_consents
ADD COLUMN IF NOT EXISTS password_temp TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS student_role TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS district_id TEXT;