-- =============================================
-- SSVRS PHASE 1: Safety Verification System
-- =============================================

-- 1. Create safety_verification_log table with immutable audit trail
CREATE TABLE IF NOT EXISTS public.safety_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  drill_session_id UUID REFERENCES public.drill_sessions(id),
  student_id UUID REFERENCES public.profiles(id),
  classroom_id UUID REFERENCES public.classrooms(id),
  actor_id UUID,
  actor_role TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  event_hash TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create immutability trigger function
CREATE OR REPLACE FUNCTION public.prevent_safety_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Safety verification logs are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Apply immutability trigger
DROP TRIGGER IF EXISTS prevent_safety_log_update ON public.safety_verification_log;
CREATE TRIGGER prevent_safety_log_update
  BEFORE UPDATE OR DELETE ON public.safety_verification_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_safety_log_modification();

-- 4. Create hash chain function for cryptographic integrity
CREATE OR REPLACE FUNCTION public.generate_safety_log_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  hash_input TEXT;
BEGIN
  SELECT event_hash INTO prev_hash 
  FROM public.safety_verification_log 
  ORDER BY created_at DESC LIMIT 1;
  
  NEW.previous_hash := COALESCE(prev_hash, 'GENESIS');
  
  hash_input := NEW.id::text || NEW.event_type || COALESCE(NEW.drill_session_id::text, '') || 
                COALESCE(NEW.student_id::text, '') || NEW.created_at::text || NEW.previous_hash;
  NEW.event_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Apply hash chain trigger
DROP TRIGGER IF EXISTS safety_log_hash_chain ON public.safety_verification_log;
CREATE TRIGGER safety_log_hash_chain
  BEFORE INSERT ON public.safety_verification_log
  FOR EACH ROW EXECUTE FUNCTION public.generate_safety_log_hash();

-- 6. Enable RLS on safety_verification_log
ALTER TABLE public.safety_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all safety logs"
  ON public.safety_verification_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view logs for their classrooms"
  ON public.safety_verification_log FOR SELECT
  USING (
    classroom_id IN (
      SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert safety logs"
  ON public.safety_verification_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Create escalation_rules table
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.districts(district_code),
  escalation_level INTEGER NOT NULL CHECK (escalation_level >= 1 AND escalation_level <= 5),
  role_target TEXT NOT NULL,
  sla_seconds INTEGER NOT NULL,
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage escalation rules"
  ON public.escalation_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view escalation rules"
  ON public.escalation_rules FOR SELECT
  USING (public.has_role(auth.uid(), 'teacher'::app_role));

-- 8. Insert default escalation rules
INSERT INTO public.escalation_rules (escalation_level, role_target, sla_seconds, notification_channels, message_template)
VALUES 
  (1, 'teacher', 60, ARRAY['in_app'], 'Student {student_name} not accounted for in {classroom_name}. Please verify location.'),
  (2, 'teacher', 180, ARRAY['in_app', 'push'], 'URGENT: Student {student_name} missing for 3+ minutes. Immediate verification required.'),
  (3, 'admin', 300, ARRAY['in_app', 'push', 'sms'], 'CRITICAL: Student {student_name} unaccounted for 5+ minutes. Admin intervention required.'),
  (4, 'admin', 600, ARRAY['in_app', 'push', 'sms', 'call'], 'EMERGENCY: Student {student_name} missing 10+ minutes. Initiate emergency protocols.')
ON CONFLICT DO NOTHING;

-- 9. Add escalation columns to drill_attendance
ALTER TABLE public.drill_attendance 
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_acknowledged_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS escalation_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 10. Create escalation_notifications table
CREATE TABLE IF NOT EXISTS public.escalation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_attendance_id UUID REFERENCES public.drill_attendance(id),
  drill_session_id UUID REFERENCES public.drill_sessions(id),
  student_id UUID REFERENCES public.profiles(id),
  escalation_level INTEGER NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id),
  target_role TEXT NOT NULL,
  notification_channel TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id),
  response_notes TEXT
);

ALTER TABLE public.escalation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all escalation notifications"
  ON public.escalation_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own notifications"
  ON public.escalation_notifications FOR SELECT
  USING (target_user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.escalation_notifications FOR UPDATE
  USING (target_user_id = auth.uid());

-- 11. Enable realtime for escalation_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalation_notifications;

-- 12. Create function to get missing students with escalation data
CREATE OR REPLACE FUNCTION public.get_missing_students_with_escalation(p_drill_session_id UUID)
RETURNS TABLE (
  attendance_id UUID,
  student_id UUID,
  student_name TEXT,
  classroom_id UUID,
  classroom_name TEXT,
  teacher_id UUID,
  teacher_name TEXT,
  status TEXT,
  escalation_level INTEGER,
  escalation_started_at TIMESTAMPTZ,
  time_missing_seconds INTEGER,
  parent_phone TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id as attendance_id,
    da.student_id,
    p.full_name as student_name,
    da.classroom_id,
    c.name as classroom_name,
    c.teacher_id,
    tp.full_name as teacher_name,
    da.status,
    COALESCE(da.escalation_level, 0) as escalation_level,
    da.escalation_started_at,
    EXTRACT(EPOCH FROM (now() - COALESCE(da.escalation_started_at, ds.started_at)))::INTEGER as time_missing_seconds,
    ec.phone_number as parent_phone
  FROM public.drill_attendance da
  JOIN public.drill_sessions ds ON ds.id = da.drill_session_id
  JOIN public.profiles p ON p.id = da.student_id
  JOIN public.classrooms c ON c.id = da.classroom_id
  JOIN public.profiles tp ON tp.id = c.teacher_id
  LEFT JOIN public.emergency_contacts ec ON ec.student_id = da.student_id AND ec.relationship = 'parent'
  WHERE da.drill_session_id = p_drill_session_id
    AND da.status IN ('missing', 'unaccounted')
    AND da.resolved_at IS NULL
  ORDER BY time_missing_seconds DESC;
END;
$$;

-- 13. Create index for performance
CREATE INDEX IF NOT EXISTS idx_safety_log_drill_session ON public.safety_verification_log(drill_session_id);
CREATE INDEX IF NOT EXISTS idx_safety_log_created_at ON public.safety_verification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalation_notifications_drill ON public.escalation_notifications(drill_session_id);
CREATE INDEX IF NOT EXISTS idx_drill_attendance_escalation ON public.drill_attendance(drill_session_id, status) WHERE status IN ('missing', 'unaccounted');