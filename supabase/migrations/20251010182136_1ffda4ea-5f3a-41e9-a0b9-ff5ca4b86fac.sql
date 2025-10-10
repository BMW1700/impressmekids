-- Phase 1: Teacher Insights Database Schema

-- 1.1 teacher_summaries table
CREATE TABLE teacher_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  students_count INTEGER NOT NULL,
  assignments_analyzed INTEGER NOT NULL,
  aura_records_analyzed INTEGER NOT NULL
);

CREATE INDEX idx_teacher_summaries_classroom ON teacher_summaries(classroom_id);
CREATE INDEX idx_teacher_summaries_teacher ON teacher_summaries(teacher_id);
CREATE INDEX idx_teacher_summaries_generated_at ON teacher_summaries(generated_at DESC);

ALTER TABLE teacher_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own summaries"
  ON teacher_summaries FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create their own summaries"
  ON teacher_summaries FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own summaries"
  ON teacher_summaries FOR DELETE
  USING (teacher_id = auth.uid());

-- 1.2 teacher_student_notes table
CREATE TABLE teacher_student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('text', 'voice', 'system')),
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read_by_student BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_teacher_notes_student ON teacher_student_notes(student_id);
CREATE INDEX idx_teacher_notes_teacher ON teacher_student_notes(teacher_id);
CREATE INDEX idx_teacher_notes_classroom ON teacher_student_notes(classroom_id);

ALTER TABLE teacher_student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage notes for their students"
  ON teacher_student_notes FOR ALL
  USING (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM classroom_students cs
      WHERE cs.student_id = teacher_student_notes.student_id
      AND cs.classroom_id = teacher_student_notes.classroom_id
      AND EXISTS (
        SELECT 1 FROM classrooms c
        WHERE c.id = cs.classroom_id
        AND c.teacher_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM classroom_students cs
      WHERE cs.student_id = teacher_student_notes.student_id
      AND cs.classroom_id = teacher_student_notes.classroom_id
      AND EXISTS (
        SELECT 1 FROM classrooms c
        WHERE c.id = cs.classroom_id
        AND c.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students can view notes about themselves"
  ON teacher_student_notes FOR SELECT
  USING (student_id = auth.uid());

-- 1.3 teacher_action_log table
CREATE TABLE teacher_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_log_student ON teacher_action_log(student_id);
CREATE INDEX idx_action_log_teacher ON teacher_action_log(teacher_id);

ALTER TABLE teacher_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own action log"
  ON teacher_action_log FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());