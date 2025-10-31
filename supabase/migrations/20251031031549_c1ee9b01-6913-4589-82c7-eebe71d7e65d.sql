-- Add group assignment support
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_group_assignment boolean DEFAULT false;

-- Create assignment groups table
CREATE TABLE IF NOT EXISTS assignment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create assignment group members table
CREATE TABLE IF NOT EXISTS assignment_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES assignment_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Create group chat messages table
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES assignment_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Update assignment_submissions to support groups
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES assignment_groups(id) ON DELETE SET NULL;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submitted_by uuid;

-- Enable RLS on new tables
ALTER TABLE assignment_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_groups
CREATE POLICY "Teachers can manage groups in their assignments"
  ON assignment_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_groups.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_groups.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own groups"
  ON assignment_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignment_group_members
      WHERE assignment_group_members.group_id = assignment_groups.id
      AND assignment_group_members.student_id = auth.uid()
    )
  );

-- RLS Policies for assignment_group_members
CREATE POLICY "Teachers can manage group members"
  ON assignment_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM assignment_groups ag
      JOIN assignments a ON a.id = ag.assignment_id
      WHERE ag.id = assignment_group_members.group_id
      AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_groups ag
      JOIN assignments a ON a.id = ag.assignment_id
      WHERE ag.id = assignment_group_members.group_id
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view members in their groups"
  ON assignment_group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM assignment_group_members
      WHERE student_id = auth.uid()
    )
  );

-- RLS Policies for group_chat_messages
CREATE POLICY "Group members can view chat messages"
  ON group_chat_messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM assignment_group_members
      WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send chat messages"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM assignment_group_members
      WHERE student_id = auth.uid()
    )
    AND student_id = auth.uid()
  );

-- Enable realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_group_members;