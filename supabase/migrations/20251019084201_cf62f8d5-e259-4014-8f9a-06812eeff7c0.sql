-- Parents can view classroom enrollments for their approved students
CREATE POLICY "Parents can view their children's classroom enrollments"
ON classroom_students FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT psl.student_id 
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() 
    AND psl.approved = true
  )
);

-- Parents can view classrooms their approved students are enrolled in
CREATE POLICY "Parents can view their children's classrooms"
ON classrooms FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cs.classroom_id
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid()
    AND psl.approved = true
  )
);

-- Parents can view assignment submissions for their approved students
CREATE POLICY "Parents can view their children's assignment submissions"
ON assignment_submissions FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT psl.student_id 
    FROM parent_student_links psl
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() 
    AND psl.approved = true
  )
);