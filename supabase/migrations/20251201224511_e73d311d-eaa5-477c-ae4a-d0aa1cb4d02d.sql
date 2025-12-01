-- Add real emergency mode and recess return features
ALTER TABLE public.drill_sessions 
ADD COLUMN IF NOT EXISTS is_real_emergency BOOLEAN DEFAULT false;

ALTER TABLE public.parent_student_links
ADD COLUMN IF NOT EXISTS notify_on_recess_return BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.drill_sessions.is_real_emergency IS 'Distinguishes real emergencies from practice drills';
COMMENT ON COLUMN public.parent_student_links.notify_on_recess_return IS 'Parent opt-in to receive notifications when child returns from recess';