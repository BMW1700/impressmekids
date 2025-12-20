-- Create visitors table for visitor management
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT REFERENCES public.districts(district_code),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  company_organization TEXT,
  purpose TEXT NOT NULL,
  host_name TEXT,
  host_id UUID REFERENCES public.profiles(id),
  photo_url TEXT,
  badge_number TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  expected_checkout TIMESTAMP WITH TIME ZONE,
  is_on_campus BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all visitors"
ON public.visitors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view visitors on campus"
ON public.visitors
FOR SELECT
USING (has_role(auth.uid(), 'teacher'::app_role) AND is_on_campus = true);

-- Create drill_visitor_attendance for tracking visitors during drills
CREATE TABLE public.drill_visitor_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drill_session_id UUID NOT NULL REFERENCES public.drill_sessions(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'present', 'missing', 'evacuated')),
  marked_at TIMESTAMP WITH TIME ZONE,
  marked_by UUID REFERENCES public.profiles(id),
  location_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drill_visitor_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for drill_visitor_attendance
CREATE POLICY "Admins can manage visitor attendance"
ON public.drill_visitor_attendance
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view and update visitor attendance"
ON public.drill_visitor_attendance
FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Create SMS notification logs table
CREATE TABLE public.sms_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drill_session_id UUID REFERENCES public.drill_sessions(id),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('parent', 'teacher', 'admin', 'emergency_contact')),
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('drill_started', 'student_status', 'all_clear', 'emergency')),
  message_content TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for SMS logs
CREATE POLICY "Admins can view all SMS logs"
ON public.sms_notification_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage SMS logs"
ON public.sms_notification_logs
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create indexes
CREATE INDEX idx_visitors_school ON public.visitors(school_id);
CREATE INDEX idx_visitors_on_campus ON public.visitors(is_on_campus);
CREATE INDEX idx_drill_visitor_attendance_session ON public.drill_visitor_attendance(drill_session_id);
CREATE INDEX idx_sms_logs_drill ON public.sms_notification_logs(drill_session_id);
CREATE INDEX idx_sms_logs_status ON public.sms_notification_logs(status);

-- Add triggers for updated_at
CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON public.visitors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drill_visitor_attendance;