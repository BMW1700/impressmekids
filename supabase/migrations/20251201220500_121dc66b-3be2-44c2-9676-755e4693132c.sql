-- Create student_signup_consents table for COPPA compliance
CREATE TABLE public.student_signup_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL UNIQUE,
  parent_email TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  consent_token TEXT NOT NULL UNIQUE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours')
);

-- Enable RLS
ALTER TABLE public.student_signup_consents ENABLE ROW LEVEL SECURITY;

-- Service role can manage all consents
CREATE POLICY "Service role can manage consents"
ON public.student_signup_consents
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Public can verify consent via token (for verification page)
CREATE POLICY "Public can verify consent"
ON public.student_signup_consents
FOR SELECT
USING (true);

-- Index for fast token lookup
CREATE INDEX idx_student_signup_consents_token ON public.student_signup_consents(consent_token);
CREATE INDEX idx_student_signup_consents_email ON public.student_signup_consents(student_email);
CREATE INDEX idx_student_signup_consents_expires ON public.student_signup_consents(expires_at);