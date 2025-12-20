-- Clear all existing plaintext passwords for security
UPDATE public.student_signup_consents
SET password_temp = NULL
WHERE password_temp IS NOT NULL;