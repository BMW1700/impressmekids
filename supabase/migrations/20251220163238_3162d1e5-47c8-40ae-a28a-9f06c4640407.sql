-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES public.districts(district_code) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add school_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_schools_district_id ON public.schools(district_id);
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);

-- RLS Policies for schools table

-- Admins in the same district can view schools
CREATE POLICY "Admins can view schools in their district"
ON public.schools
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.district_id = schools.district_id
  )
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM districts d
      WHERE d.district_code = schools.district_id
      AND d.name = da.district_name
    )
  )
);

-- Admins can create schools in their district
CREATE POLICY "Admins can create schools in their district"
ON public.schools
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.district_id = district_id
  )
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM districts d
      WHERE d.district_code = district_id
      AND d.name = da.district_name
    )
  )
);

-- Admins can update schools in their district
CREATE POLICY "Admins can update schools in their district"
ON public.schools
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.district_id = schools.district_id
  )
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM districts d
      WHERE d.district_code = schools.district_id
      AND d.name = da.district_name
    )
  )
);

-- Admins can delete schools in their district
CREATE POLICY "Admins can delete schools in their district"
ON public.schools
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND p.district_id = schools.district_id
  )
  OR
  EXISTS (
    SELECT 1 FROM district_admins da
    WHERE da.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM districts d
      WHERE d.district_code = schools.district_id
      AND d.name = da.district_name
    )
  )
);

-- Teachers, students can view their own school
CREATE POLICY "Users can view their own school"
ON public.schools
FOR SELECT
USING (
  id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();