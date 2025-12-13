-- Create table for substitute teacher access links
CREATE TABLE public.substitute_access_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE,
  substitute_name TEXT,
  substitute_email TEXT,
  access_start TIMESTAMP WITH TIME ZONE NOT NULL,
  access_end TIMESTAMP WITH TIME ZONE NOT NULL,
  permissions JSONB DEFAULT '{"view_students": true, "take_attendance": true, "view_assignments": true, "post_announcements": false}'::jsonb,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.substitute_access_links ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own links
CREATE POLICY "Teachers can manage their substitute links" 
  ON public.substitute_access_links
  FOR ALL
  USING (teacher_id = auth.uid());

-- Allow substitutes to view links for classrooms they have access to
CREATE POLICY "Substitutes can view active links"
  ON public.substitute_access_links
  FOR SELECT
  USING (
    used_by = auth.uid() 
    AND is_active = true 
    AND access_end > now()
  );

-- Create index for faster lookups
CREATE INDEX idx_substitute_access_links_classroom ON public.substitute_access_links(classroom_id);
CREATE INDEX idx_substitute_access_links_code ON public.substitute_access_links(access_code);
CREATE INDEX idx_substitute_access_links_active ON public.substitute_access_links(is_active, access_end) WHERE is_active = true;

-- Function to check if user has substitute access to a classroom
CREATE OR REPLACE FUNCTION public.has_substitute_access(_user_id uuid, _classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.substitute_access_links
    WHERE classroom_id = _classroom_id
      AND used_by = _user_id
      AND is_active = true
      AND now() BETWEEN access_start AND access_end
  )
$$;