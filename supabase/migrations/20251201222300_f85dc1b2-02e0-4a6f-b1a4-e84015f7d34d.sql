-- Phase 1: Enhance drill_sessions table for scheduling and all-clear
ALTER TABLE public.drill_sessions
ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
ADD COLUMN IF NOT EXISTS announced_at timestamptz,
ADD COLUMN IF NOT EXISTS all_clear_at timestamptz,
ADD COLUMN IF NOT EXISTS all_clear_by uuid REFERENCES public.profiles(id);

-- Phase 1: Enhance drill_attendance table for student self-check-in
ALTER TABLE public.drill_attendance
ADD COLUMN IF NOT EXISTS student_checked_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS student_checkin_at timestamptz;

-- Add RLS policy for students to update their own check-in status
CREATE POLICY "Students can check themselves in during drills"
ON public.drill_attendance
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Add index for faster queries on scheduled drills
CREATE INDEX IF NOT EXISTS idx_drill_sessions_scheduled ON public.drill_sessions(scheduled_for) WHERE status = 'scheduled';

-- Add index for faster queries on active drills
CREATE INDEX IF NOT EXISTS idx_drill_sessions_active ON public.drill_sessions(status, started_at) WHERE status = 'in_progress';

-- Update CHECK constraint to include 'scheduled' status
ALTER TABLE public.drill_sessions DROP CONSTRAINT IF EXISTS drill_sessions_status_check;
ALTER TABLE public.drill_sessions ADD CONSTRAINT drill_sessions_status_check 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));