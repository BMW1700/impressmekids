-- Create parent_consents table for FERPA/COPPA compliance
CREATE TABLE IF NOT EXISTS public.parent_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aura_recording_consent BOOLEAN NOT NULL DEFAULT false,
  assignment_data_consent BOOLEAN NOT NULL DEFAULT false,
  third_party_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parent_accounts table
CREATE TABLE IF NOT EXISTS public.parent_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parent_student_links table
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  UNIQUE(parent_id, student_id)
);

-- Create parent_access_requests table for teacher approval workflow
CREATE TABLE IF NOT EXISTS public.parent_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(parent_id, student_id, classroom_id)
);

-- Add district_admin to user_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'district_admin', 'parent');
  ELSE
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'district_admin';
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
  END IF;
END $$;

-- Create district_admins table
CREATE TABLE IF NOT EXISTS public.district_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  district_name TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create teacher_summaries table if not exists
CREATE TABLE IF NOT EXISTS public.teacher_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.parent_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_consents
CREATE POLICY "Parents can view their own consents"
  ON public.parent_consents FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert their own consents"
  ON public.parent_consents FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their own consents"
  ON public.parent_consents FOR UPDATE
  USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view consents for their students"
  ON public.parent_consents FOR SELECT
  USING (student_id IN (
    SELECT cs.student_id FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  ));

-- RLS Policies for parent_accounts
CREATE POLICY "Parents can view their own account"
  ON public.parent_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Parents can insert their own account"
  ON public.parent_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Parents can update their own account"
  ON public.parent_accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view parent accounts for their students"
  ON public.parent_accounts FOR SELECT
  USING (id IN (
    SELECT psl.parent_id FROM parent_student_links psl
    WHERE psl.student_id IN (
      SELECT cs.student_id FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  ));

-- RLS Policies for parent_student_links
CREATE POLICY "Parents can view their own links"
  ON public.parent_student_links FOR SELECT
  USING (parent_id IN (SELECT id FROM parent_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Parents can insert their own links"
  ON public.parent_student_links FOR INSERT
  WITH CHECK (parent_id IN (SELECT id FROM parent_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view and approve links for their students"
  ON public.parent_student_links FOR ALL
  USING (student_id IN (
    SELECT cs.student_id FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  ));

CREATE POLICY "Students can view their own parent links"
  ON public.parent_student_links FOR SELECT
  USING (student_id = auth.uid());

-- RLS Policies for parent_access_requests
CREATE POLICY "Parents can view their own requests"
  ON public.parent_access_requests FOR SELECT
  USING (parent_id IN (SELECT id FROM parent_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Parents can create their own requests"
  ON public.parent_access_requests FOR INSERT
  WITH CHECK (parent_id IN (SELECT id FROM parent_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can manage requests for their classrooms"
  ON public.parent_access_requests FOR ALL
  USING (teacher_id = auth.uid());

-- RLS Policies for district_admins
CREATE POLICY "District admins can view their own account"
  ON public.district_admins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "District admins can insert their own account"
  ON public.district_admins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for teacher_summaries
CREATE POLICY "Teachers can view summaries for their classrooms"
  ON public.teacher_summaries FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert summaries for their classrooms"
  ON public.teacher_summaries FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "District admins can view all summaries"
  ON public.teacher_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM district_admins WHERE user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_consents_parent_id ON public.parent_consents(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_consents_student_id ON public.parent_consents(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_access_requests_teacher_id ON public.parent_access_requests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_parent_access_requests_status ON public.parent_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_teacher_summaries_classroom_id ON public.teacher_summaries(classroom_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_parent_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_consents_updated_at
  BEFORE UPDATE ON public.parent_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_consents_updated_at();