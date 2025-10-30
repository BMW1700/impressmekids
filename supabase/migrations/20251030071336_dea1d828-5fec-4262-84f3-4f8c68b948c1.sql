-- Create parent notification preferences table
CREATE TABLE parent_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
  notify_assignments BOOLEAN DEFAULT true,
  notify_tests BOOLEAN DEFAULT true,
  notify_events BOOLEAN DEFAULT true,
  notification_days_before INTEGER DEFAULT 1 CHECK (notification_days_before >= 0 AND notification_days_before <= 7),
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id)
);

CREATE INDEX idx_parent_notification_parent ON parent_notification_preferences(parent_id);

-- RLS policies for parent_notification_preferences
ALTER TABLE parent_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own notification preferences"
ON parent_notification_preferences
FOR SELECT
USING (parent_id = get_parent_id(auth.uid()));

CREATE POLICY "Parents can insert their own notification preferences"
ON parent_notification_preferences
FOR INSERT
WITH CHECK (parent_id = get_parent_id(auth.uid()));

CREATE POLICY "Parents can update their own notification preferences"
ON parent_notification_preferences
FOR UPDATE
USING (parent_id = get_parent_id(auth.uid()));

-- Service role can read all preferences for notification system
CREATE POLICY "Service role can read all preferences"
ON parent_notification_preferences
FOR SELECT
USING (auth.jwt()->>'role' = 'service_role');

-- Create parent notifications table for in-app notifications
CREATE TABLE parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('assignment', 'test', 'event', 'school_event')),
  item_id UUID NOT NULL,
  item_title TEXT NOT NULL,
  item_description TEXT,
  event_date DATE NOT NULL,
  classroom_name TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_parent_notifications_parent ON parent_notifications(parent_id);
CREATE INDEX idx_parent_notifications_read ON parent_notifications(parent_id, read);

-- RLS policies for parent_notifications
ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own notifications"
ON parent_notifications
FOR SELECT
USING (parent_id = get_parent_id(auth.uid()));

CREATE POLICY "Parents can update their own notifications"
ON parent_notifications
FOR UPDATE
USING (parent_id = get_parent_id(auth.uid()));

CREATE POLICY "Service role can insert notifications"
ON parent_notifications
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_parent_notification_preferences_updated_at
BEFORE UPDATE ON parent_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_parent_notification_preferences_updated_at();