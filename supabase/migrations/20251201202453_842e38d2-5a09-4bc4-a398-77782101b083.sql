-- Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "Users can view their own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Schedule weather alert check to run every 15 minutes
SELECT cron.schedule(
  'check-weather-alerts-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjigkjwkgovculkovcjy.supabase.co/functions/v1/check-weather-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqaWdrandrZ292Y3Vsa292Y2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTEyNzIsImV4cCI6MjA3NDgyNzI3Mn0.k1PpVP4GfTWGzl-gOdJneVNGzqzLKTTyn3sdqNiSv2s"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);