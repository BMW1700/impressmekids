-- Create practice_exercises table for AI-generated personalized exercises
CREATE TABLE practice_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phoneme_targets TEXT[] NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('tongue_twister', 'read_aloud', 'creative')),
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE practice_exercises ENABLE ROW LEVEL SECURITY;

-- Students can view and update their own exercises
CREATE POLICY "Students can view their own exercises"
ON practice_exercises FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own exercises"
ON practice_exercises FOR UPDATE
USING (student_id = auth.uid());

-- Teachers can view exercises for their students
CREATE POLICY "Teachers can view student exercises"
ON practice_exercises FOR SELECT
USING (
  student_id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

-- System can insert exercises
CREATE POLICY "System can create exercises"
ON practice_exercises FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_practice_exercises_student ON practice_exercises(student_id);
CREATE INDEX idx_practice_exercises_completed ON practice_exercises(completed);
