-- Drop the existing table if it exists and recreate with correct structure
DROP TABLE IF EXISTS public.school_settings CASCADE;

-- Create school_settings table for global school configuration
CREATE TABLE public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_start date NOT NULL DEFAULT date_trunc('year', CURRENT_DATE)::date,
  school_year_end date NOT NULL DEFAULT (date_trunc('year', CURRENT_DATE) + interval '1 year')::date,
  timezone text NOT NULL DEFAULT 'America/New_York',
  school_start_time time NOT NULL DEFAULT '08:00:00',
  school_end_time time NOT NULL DEFAULT '15:00:00',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Only one settings row should exist
CREATE UNIQUE INDEX single_settings_row ON public.school_settings ((true));

-- Insert default settings
INSERT INTO public.school_settings (school_year_start, school_year_end, timezone, school_start_time, school_end_time)
VALUES (
  date_trunc('year', CURRENT_DATE)::date,
  (date_trunc('year', CURRENT_DATE) + interval '1 year')::date,
  'America/New_York',
  '08:00:00',
  '15:00:00'
);

-- RLS Policies
CREATE POLICY "Everyone can view school settings"
  ON public.school_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update school settings"
  ON public.school_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));