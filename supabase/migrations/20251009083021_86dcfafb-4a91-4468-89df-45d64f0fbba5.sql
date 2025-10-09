-- Phase 4: Real-time Feedback + Diarization

-- Add real-time feedback tracking to aura_records
ALTER TABLE aura_records
ADD COLUMN realtime_feedback JSONB DEFAULT '[]'::jsonb,
ADD COLUMN speaker_segments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN diarization_confidence NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN aura_records.realtime_feedback IS 'Array of timestamped feedback events during recording: {timestamp, type, message, confidence}';
COMMENT ON COLUMN aura_records.speaker_segments IS 'Speaker diarization data: {start, end, speaker_id, confidence}';
COMMENT ON COLUMN aura_records.diarization_confidence IS 'Overall confidence score for speaker identification (0-100)';

-- Create real-time practice sessions table
CREATE TABLE IF NOT EXISTS realtime_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  exercise_id UUID REFERENCES practice_exercises(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  realtime_metrics JSONB DEFAULT '{}'::jsonb,
  feedback_events JSONB DEFAULT '[]'::jsonb,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE realtime_practice_sessions IS 'Tracks live practice sessions with real-time feedback and metrics';
COMMENT ON COLUMN realtime_practice_sessions.realtime_metrics IS 'Live metrics: {avg_confidence, pace_stability, clarity_trend, phoneme_accuracy_live}';
COMMENT ON COLUMN realtime_practice_sessions.feedback_events IS 'Timestamped feedback shown during practice: {time, type, message, severity}';

-- Enable RLS
ALTER TABLE realtime_practice_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for realtime_practice_sessions
CREATE POLICY "Students can view their own sessions"
ON realtime_practice_sessions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can create their own sessions"
ON realtime_practice_sessions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own sessions"
ON realtime_practice_sessions FOR UPDATE
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view sessions for their students"
ON realtime_practice_sessions FOR SELECT
USING (
  student_id IN (
    SELECT cs.student_id 
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_realtime_sessions_student ON realtime_practice_sessions(student_id, status);
CREATE INDEX idx_realtime_sessions_exercise ON realtime_practice_sessions(exercise_id);

-- Add real-time capabilities trigger for presence tracking
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_practice_sessions;