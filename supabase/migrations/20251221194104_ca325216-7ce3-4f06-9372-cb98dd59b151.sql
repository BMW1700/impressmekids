-- Create school_resources table for storing external links per school
CREATE TABLE public.school_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_resources ENABLE ROW LEVEL SECURITY;

-- Policies for admins to manage school resources
CREATE POLICY "Admins can view school resources"
  ON public.school_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert school resources"
  ON public.school_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update school resources"
  ON public.school_resources
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete school resources"
  ON public.school_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for updating updated_at
CREATE TRIGGER update_school_resources_updated_at
  BEFORE UPDATE ON public.school_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();