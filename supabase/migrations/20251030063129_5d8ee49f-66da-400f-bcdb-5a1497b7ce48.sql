-- ============================================
-- COMPREHENSIVE CALENDAR SYSTEM DATABASE SCHEMA
-- ============================================

-- 1. Update classrooms table to include schedule information
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS meeting_days TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS schedule_start_date DATE;

COMMENT ON COLUMN public.classrooms.meeting_days IS 'Days of week class meets: Mon, Tue, Wed, Thu, Fri, Sat, Sun';
COMMENT ON COLUMN public.classrooms.start_time IS 'Class start time';
COMMENT ON COLUMN public.classrooms.end_time IS 'Class end time';
COMMENT ON COLUMN public.classrooms.location IS 'Room number or building location';
COMMENT ON COLUMN public.classrooms.schedule_start_date IS 'When the recurring class schedule begins';

-- 2. Create event_category enum
CREATE TYPE public.event_category AS ENUM (
  'quiz',
  'test',
  'field_trip',
  'guest_speaker',
  'homework_due',
  'project_presentation',
  'parent_teacher_conference',
  'other'
);

-- 3. Create events table for class-specific events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  category public.event_category NOT NULL DEFAULT 'other',
  attachments JSONB DEFAULT '[]', -- Array of {name: string, url: string}
  is_repeating BOOLEAN DEFAULT FALSE,
  repeat_days TEXT[] DEFAULT '{}', -- Days to repeat: Mon, Tue, Wed, etc
  repeat_end_date DATE,
  is_posted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_classroom ON public.events(classroom_id);
CREATE INDEX idx_events_teacher ON public.events(teacher_id);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_posted ON public.events(is_posted);

COMMENT ON TABLE public.events IS 'Class-specific events created by teachers';

-- 4. Update assignments table to add is_posted status
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS is_posted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_assignments_posted ON public.assignments(is_posted);

COMMENT ON COLUMN public.assignments.is_posted IS 'Whether assignment is visible to students';

-- 5. Create school_event_type enum
CREATE TYPE public.school_event_type AS ENUM (
  'holiday',
  'school_break',
  'assembly',
  'testing_day',
  'early_dismissal',
  'picture_day',
  'other'
);

-- 6. Create school_events table for school-wide events
CREATE TABLE IF NOT EXISTS public.school_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type public.school_event_type NOT NULL,
  created_by UUID NOT NULL, -- Admin who created it
  blocks_classes BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_school_events_date ON public.school_events(event_date);
CREATE INDEX idx_school_events_type ON public.school_events(event_type);

COMMENT ON TABLE public.school_events IS 'School-wide events managed by administrators';
COMMENT ON COLUMN public.school_events.blocks_classes IS 'Whether regular classes are hidden on this date';

-- 7. Create school_settings table
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year_start DATE NOT NULL,
  school_year_end DATE NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  school_day_start TIME DEFAULT '08:00',
  school_day_end TIME DEFAULT '15:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default school settings
INSERT INTO public.school_settings (school_year_start, school_year_end)
VALUES ('2024-09-01', '2025-06-30')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.school_settings IS 'School-wide calendar settings';

-- 8. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_school_events_updated_at
BEFORE UPDATE ON public.school_events
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_updated_at();

CREATE TRIGGER update_school_settings_updated_at
BEFORE UPDATE ON public.school_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Teachers can create events in their classrooms
CREATE POLICY "Teachers can create events in their classrooms"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  is_classroom_teacher(auth.uid(), classroom_id)
);

-- Teachers can view all events in their classrooms (including drafts)
CREATE POLICY "Teachers can view events in their classrooms"
ON public.events
FOR SELECT
TO authenticated
USING (
  is_classroom_teacher(auth.uid(), classroom_id)
);

-- Teachers can update their own events
CREATE POLICY "Teachers can update their own events"
ON public.events
FOR UPDATE
TO authenticated
USING (
  teacher_id = auth.uid() AND is_classroom_teacher(auth.uid(), classroom_id)
);

-- Teachers can delete their own events
CREATE POLICY "Teachers can delete their own events"
ON public.events
FOR DELETE
TO authenticated
USING (
  teacher_id = auth.uid() AND is_classroom_teacher(auth.uid(), classroom_id)
);

-- Students can view posted events in their classrooms
CREATE POLICY "Students can view posted events in their classrooms"
ON public.events
FOR SELECT
TO authenticated
USING (
  is_posted = true AND is_classroom_student(auth.uid(), classroom_id)
);

-- Parents can view posted events for their children's classrooms
CREATE POLICY "Parents can view posted events for their children"
ON public.events
FOR SELECT
TO authenticated
USING (
  is_posted = true AND
  classroom_id IN (
    SELECT cs.classroom_id
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() AND psl.approved = true
  )
);

-- Enable RLS on school_events table
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

-- Admins can manage school events
CREATE POLICY "Admins can manage school events"
ON public.school_events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view school events
CREATE POLICY "Everyone can view school events"
ON public.school_events
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on school_settings table
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage school settings
CREATE POLICY "Admins can manage school settings"
ON public.school_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can view school settings
CREATE POLICY "Everyone can view school settings"
ON public.school_settings
FOR SELECT
TO authenticated
USING (true);

-- Update assignments RLS to include is_posted filter for students
DROP POLICY IF EXISTS "Students can view published assignments in their classrooms" ON public.assignments;

CREATE POLICY "Students can view published and posted assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  status = 'published' AND 
  is_posted = true AND 
  is_classroom_student(auth.uid(), classroom_id)
);

-- Parents can view posted assignments for their children
CREATE POLICY "Parents can view posted assignments for their children"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  status = 'published' AND
  is_posted = true AND
  classroom_id IN (
    SELECT cs.classroom_id
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() AND psl.approved = true
  )
);