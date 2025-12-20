-- Add missing affects_attendance column to safety_alerts table
ALTER TABLE public.safety_alerts 
ADD COLUMN IF NOT EXISTS affects_attendance boolean DEFAULT false;