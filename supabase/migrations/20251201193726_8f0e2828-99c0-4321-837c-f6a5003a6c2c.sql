-- Phase 1: Database Updates for School-Wide Drills and Reunification

-- Add school_drill_id to drill_sessions for coordinating school-wide drills
ALTER TABLE public.drill_sessions 
ADD COLUMN school_drill_id UUID REFERENCES public.drill_sessions(id) ON DELETE CASCADE;

CREATE INDEX idx_drill_sessions_school_drill_id ON public.drill_sessions(school_drill_id);

-- Create reunification_events table
CREATE TABLE public.reunification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.districts(district_code) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reunification_events_school_id ON public.reunification_events(school_id);
CREATE INDEX idx_reunification_events_status ON public.reunification_events(status);

-- Create student_pickups table
CREATE TABLE public.student_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reunification_event_id UUID REFERENCES public.reunification_events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  picked_up_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  relationship TEXT NOT NULL,
  pickup_time TIMESTAMPTZ DEFAULT now(),
  released_by_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  qr_verified BOOLEAN DEFAULT false,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_student_pickups_event_id ON public.student_pickups(reunification_event_id);
CREATE INDEX idx_student_pickups_student_id ON public.student_pickups(student_id);
CREATE INDEX idx_student_pickups_pickup_time ON public.student_pickups(pickup_time);

-- RLS Policies for reunification_events
ALTER TABLE public.reunification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reunification events"
  ON public.reunification_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view reunification events"
  ON public.reunification_events
  FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role));

-- RLS Policies for student_pickups
ALTER TABLE public.student_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and teachers can manage pickups"
  ON public.student_pickups
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Parents can view their student pickups"
  ON public.student_pickups
  FOR SELECT
  USING (is_parent_of_student(auth.uid(), student_id));

CREATE POLICY "Students can view their own pickups"
  ON public.student_pickups
  FOR SELECT
  USING (auth.uid() = student_id);