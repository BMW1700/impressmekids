-- Add school_id and district_id columns to safety_alerts table
ALTER TABLE public.safety_alerts 
ADD COLUMN IF NOT EXISTS school_id TEXT REFERENCES public.districts(district_code),
ADD COLUMN IF NOT EXISTS district_id TEXT REFERENCES public.districts(district_code);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_safety_alerts_school_id ON public.safety_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_district_id ON public.safety_alerts(district_id);