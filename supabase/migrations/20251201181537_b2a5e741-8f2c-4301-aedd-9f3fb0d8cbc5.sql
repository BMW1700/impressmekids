-- Safety Alerts System Tables

-- Main safety alerts table
CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('weather', 'closing', 'drill', 'emergency', 'early_dismissal')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  school_id TEXT REFERENCES public.districts(district_code),
  is_active BOOLEAN DEFAULT true,
  notify_parents BOOLEAN DEFAULT true,
  notify_students BOOLEAN DEFAULT true,
  notify_teachers BOOLEAN DEFAULT true,
  authority_verified BOOLEAN DEFAULT false,
  authority_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Track who has acknowledged alerts
CREATE TABLE IF NOT EXISTS public.safety_alert_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.safety_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alert_id, user_id)
);

-- Drill sessions for attendance tracking
CREATE TABLE IF NOT EXISTS public.drill_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_type TEXT NOT NULL CHECK (drill_type IN ('fire_drill', 'lockdown_drill', 'tornado_drill', 'earthquake_drill', 'evacuation_drill')),
  school_id TEXT REFERENCES public.districts(district_code),
  classroom_id UUID REFERENCES public.classrooms(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes TEXT
);

-- Drill attendance tracking
CREATE TABLE IF NOT EXISTS public.drill_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_session_id UUID NOT NULL REFERENCES public.drill_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id),
  status TEXT NOT NULL DEFAULT 'unaccounted' CHECK (status IN ('present', 'absent', 'unaccounted')),
  marked_by UUID REFERENCES public.profiles(id),
  marked_at TIMESTAMPTZ,
  parent_notified BOOLEAN DEFAULT false,
  location_notes TEXT,
  UNIQUE(drill_session_id, student_id)
);

-- Parent-Teacher messaging
CREATE TABLE IF NOT EXISTS public.parent_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('behavior', 'health', 'pickup', 'attendance', 'praise', 'question', 'custom')),
  subject TEXT NOT NULL,
  message_text TEXT NOT NULL,
  is_from_parent BOOLEAN NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_for_parent BOOLEAN NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Authority alert sources (verified police/district webhook endpoints)
CREATE TABLE IF NOT EXISTS public.authority_alert_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('police', 'district', 'emergency_services', 'weather_service')),
  webhook_url TEXT,
  api_key_hash TEXT,
  is_verified BOOLEAN DEFAULT false,
  school_id TEXT REFERENCES public.districts(district_code),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_verified_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_safety_alerts_school ON public.safety_alerts(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_active ON public.safety_alerts(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drill_sessions_status ON public.drill_sessions(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_drill_attendance_session ON public.drill_attendance(drill_session_id, status);
CREATE INDEX IF NOT EXISTS idx_drill_attendance_student ON public.drill_attendance(student_id, drill_session_id);
CREATE INDEX IF NOT EXISTS idx_parent_teacher_messages_parent ON public.parent_teacher_messages(parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_teacher_messages_teacher ON public.parent_teacher_messages(teacher_id, created_at DESC);

-- RLS Policies

-- Safety Alerts: Everyone can view active alerts in their school
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active alerts in their school"
ON public.safety_alerts
FOR SELECT
TO authenticated
USING (
  is_active = true AND
  (school_id IS NULL OR school_id IN (
    SELECT district_id FROM public.profiles WHERE id = auth.uid()
  ))
);

CREATE POLICY "Admins can manage safety alerts"
ON public.safety_alerts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Alert Acknowledgments
ALTER TABLE public.safety_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acknowledgments"
ON public.safety_alert_acknowledgments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge alerts"
ON public.safety_alert_acknowledgments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drill Sessions
ALTER TABLE public.drill_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view drill sessions in their school"
ON public.drill_sessions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Teachers and admins can manage drill sessions"
ON public.drill_sessions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Drill Attendance
ALTER TABLE public.drill_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage drill attendance"
ON public.drill_attendance
FOR ALL
TO authenticated
USING (
  is_classroom_teacher(auth.uid(), classroom_id) OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  is_classroom_teacher(auth.uid(), classroom_id) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Parents can view their children drill attendance"
ON public.drill_attendance
FOR SELECT
TO authenticated
USING (is_parent_of_student(auth.uid(), student_id));

CREATE POLICY "Students can view their own drill attendance"
ON public.drill_attendance
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Parent-Teacher Messages
ALTER TABLE public.parent_teacher_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view and send their messages"
ON public.parent_teacher_messages
FOR ALL
TO authenticated
USING (
  is_parent(auth.uid()) AND
  parent_id = (SELECT id FROM public.parent_accounts WHERE user_id = auth.uid())
)
WITH CHECK (
  is_parent(auth.uid()) AND
  parent_id = (SELECT id FROM public.parent_accounts WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view and respond to messages"
ON public.parent_teacher_messages
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  auth.uid() = teacher_id
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND
  auth.uid() = teacher_id
);

-- Message Templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view message templates"
ON public.message_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers and admins can manage templates"
ON public.message_templates
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Authority Alert Sources
ALTER TABLE public.authority_alert_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage authority sources"
ON public.authority_alert_sources
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default message templates
INSERT INTO public.message_templates (template_type, title, content, is_for_parent) VALUES
('pickup', 'Pickup Change', 'My child will be picked up by [Name] today at [Time].', true),
('late', 'Running Late', 'My child will be late today because [Reason]. Expected arrival: [Time].', true),
('absence', 'Absence Notice', 'My child will be absent on [Date] due to [Reason].', true),
('health', 'Health Concern', 'I need to discuss a health concern regarding my child: [Details]', true),
('behavior', 'Behavior Question', 'I have a question about my child''s recent behavior: [Details]', true),
('conference', 'Request Meeting', 'I would like to schedule a meeting to discuss my child''s progress. Available times: [Times]', true),
('teacher_behavior', 'Behavior Update', 'I wanted to share an update about [Student]''s behavior today: [Details]', false),
('teacher_praise', 'Student Praise', '[Student] did excellent work today on [Activity]. Keep it up!', false),
('teacher_concern', 'Academic Concern', 'I have some concerns about [Student]''s performance in [Subject]. Can we schedule a call?', false),
('teacher_reminder', 'Assignment Reminder', 'Reminder: [Student] has [Assignment] due on [Date]. Please help ensure it''s completed.', false);

-- Enable realtime for drill attendance (critical for parent notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.drill_attendance;