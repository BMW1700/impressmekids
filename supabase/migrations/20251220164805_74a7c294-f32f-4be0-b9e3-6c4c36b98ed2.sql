-- Add school_id column to safety_alerts for school-level scoping
ALTER TABLE public.safety_alerts 
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_safety_alerts_school_id ON public.safety_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_district_school ON public.safety_alerts(district_id, school_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.safety_alerts.school_id IS 'Optional school-level scoping. If NULL, alert applies to all schools in the district.';