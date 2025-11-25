-- Phase 1: Word-by-Word Reading Analytics Tables

-- Reading session metrics
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  passage_text TEXT NOT NULL,
  words_read INTEGER NOT NULL,
  duration_seconds NUMERIC NOT NULL,
  wpm NUMERIC NOT NULL,
  accuracy_percent NUMERIC NOT NULL,
  fluency_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Word-level analytics
CREATE TABLE word_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES reading_sessions(id) ON DELETE CASCADE NOT NULL,
  word_text TEXT NOT NULL,
  word_index INTEGER NOT NULL,
  start_time_ms NUMERIC NOT NULL,
  end_time_ms NUMERIC NOT NULL,
  phonemes_detected JSONB DEFAULT '[]'::jsonb,
  phonemes_expected JSONB DEFAULT '[]'::jsonb,
  was_correct BOOLEAN NOT NULL,
  hesitation_detected BOOLEAN DEFAULT FALSE,
  mispronunciation_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student mispronunciation patterns
CREATE TABLE student_error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  error_type TEXT NOT NULL,
  word_examples TEXT[] NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, error_type)
);

-- Gamification stats
CREATE TABLE student_reading_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_words_read INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges_earned TEXT[] DEFAULT '{}',
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reading_sessions_student ON reading_sessions(student_id, created_at DESC);
CREATE INDEX idx_reading_sessions_assignment ON reading_sessions(assignment_id, created_at DESC);
CREATE INDEX idx_word_readings_session ON word_readings(session_id, word_index);
CREATE INDEX idx_word_readings_incorrect ON word_readings(session_id) WHERE was_correct = FALSE;
CREATE INDEX idx_error_patterns_student ON student_error_patterns(student_id, mastered);
CREATE INDEX idx_student_stats_xp ON student_reading_stats(xp_points DESC);

-- Enable RLS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reading_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_sessions
CREATE POLICY "Students can view their own reading sessions"
  ON reading_sessions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own reading sessions"
  ON reading_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view reading sessions for their students"
  ON reading_sessions FOR SELECT
  USING (
    student_id IN (
      SELECT cs.student_id 
      FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for word_readings
CREATE POLICY "Students can view their own word readings"
  ON word_readings FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM reading_sessions WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own word readings"
  ON word_readings FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM reading_sessions WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view word readings for their students"
  ON word_readings FOR SELECT
  USING (
    session_id IN (
      SELECT rs.id FROM reading_sessions rs
      JOIN classroom_students cs ON cs.student_id = rs.student_id
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for student_error_patterns
CREATE POLICY "Students can view their own error patterns"
  ON student_error_patterns FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can manage error patterns"
  ON student_error_patterns FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Teachers can view error patterns for their students"
  ON student_error_patterns FOR SELECT
  USING (
    student_id IN (
      SELECT cs.student_id 
      FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for student_reading_stats
CREATE POLICY "Students can view their own reading stats"
  ON student_reading_stats FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can update their own reading stats"
  ON student_reading_stats FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view reading stats for their students"
  ON student_reading_stats FOR SELECT
  USING (
    student_id IN (
      SELECT cs.student_id 
      FROM classroom_students cs
      JOIN classrooms c ON c.id = cs.classroom_id
      WHERE c.teacher_id = auth.uid()
    )
  );