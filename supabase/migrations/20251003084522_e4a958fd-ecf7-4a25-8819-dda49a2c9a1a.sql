-- Create question_groups table
CREATE TABLE question_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_question_groups_classroom ON question_groups(classroom_id);

-- RLS Policies for question_groups
ALTER TABLE question_groups ENABLE ROW LEVEL SECURITY;

-- Teachers can view groups in their classrooms
CREATE POLICY "Teachers can view groups in their classrooms"
ON question_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = question_groups.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Teachers can create groups in their classrooms
CREATE POLICY "Teachers can create groups in their classrooms"
ON question_groups FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = question_groups.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Teachers can update their own groups
CREATE POLICY "Teachers can update their own groups"
ON question_groups FOR UPDATE
USING (created_by = auth.uid());

-- Teachers can delete their own groups
CREATE POLICY "Teachers can delete their own groups"
ON question_groups FOR DELETE
USING (created_by = auth.uid());

-- Modify questions table to add group_id
ALTER TABLE questions 
ADD COLUMN group_id UUID REFERENCES question_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_questions_group ON questions(group_id);

-- Create flashcard_sets table
CREATE TABLE flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_group_id UUID NOT NULL REFERENCES question_groups(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_sets_group ON flashcard_sets(question_group_id);
CREATE INDEX idx_flashcard_sets_classroom ON flashcard_sets(classroom_id);

-- RLS Policies for flashcard_sets
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;

-- Teachers can view flashcard sets in their classrooms
CREATE POLICY "Teachers can view flashcard sets"
ON flashcard_sets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = flashcard_sets.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Students can view flashcard sets in their classrooms
CREATE POLICY "Students can view flashcard sets"
ON flashcard_sets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classroom_students 
    WHERE classroom_students.classroom_id = flashcard_sets.classroom_id 
    AND classroom_students.student_id = auth.uid()
  )
);

-- Teachers can create flashcard sets
CREATE POLICY "Teachers can create flashcard sets"
ON flashcard_sets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classrooms 
    WHERE classrooms.id = flashcard_sets.classroom_id 
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Teachers can update their own flashcard sets
CREATE POLICY "Teachers can update flashcard sets"
ON flashcard_sets FOR UPDATE
USING (created_by = auth.uid());

-- Teachers can delete their own flashcard sets
CREATE POLICY "Teachers can delete flashcard sets"
ON flashcard_sets FOR DELETE
USING (created_by = auth.uid());