-- Create table for tracking risk score history
CREATE TABLE IF NOT EXISTS public.student_risk_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('urgent', 'monitor', 'on-track')),
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for intervention tracking
CREATE TABLE IF NOT EXISTS public.student_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL,
  notes TEXT,
  risk_score_before INTEGER NOT NULL,
  risk_score_after INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create table for email notification tracking
CREATE TABLE IF NOT EXISTS public.risk_alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('urgent_teacher', 'monitor_teacher', 'parent_alert', 'weekly_digest')),
  risk_score INTEGER NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_status TEXT NOT NULL DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'bounced'))
);

-- Create indexes for performance
CREATE INDEX idx_risk_history_student_created ON public.student_risk_history(student_id, created_at DESC);
CREATE INDEX idx_risk_history_classroom ON public.student_risk_history(classroom_id);
CREATE INDEX idx_interventions_student ON public.student_interventions(student_id);
CREATE INDEX idx_interventions_teacher ON public.student_interventions(teacher_id);
CREATE INDEX idx_interventions_status ON public.student_interventions(status);
CREATE INDEX idx_notifications_student ON public.risk_alert_notifications(student_id);
CREATE INDEX idx_notifications_teacher ON public.risk_alert_notifications(teacher_id);

-- Enable RLS
ALTER TABLE public.student_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_alert_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_risk_history
CREATE POLICY "Teachers can view risk history for their students"
  ON public.student_risk_history FOR SELECT
  USING (
    classroom_id IN (
      SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can insert risk history"
  ON public.student_risk_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies for student_interventions
CREATE POLICY "Teachers can manage interventions for their students"
  ON public.student_interventions FOR ALL
  USING (
    classroom_id IN (
      SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    classroom_id IN (
      SELECT id FROM public.classrooms WHERE teacher_id = auth.uid()
    )
  );

-- RLS Policies for risk_alert_notifications
CREATE POLICY "Teachers can view their notifications"
  ON public.risk_alert_notifications FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view their notifications"
  ON public.risk_alert_notifications FOR SELECT
  USING (
    parent_id = get_parent_id(auth.uid())
  );

CREATE POLICY "System can insert notifications"
  ON public.risk_alert_notifications FOR INSERT
  WITH CHECK (true);