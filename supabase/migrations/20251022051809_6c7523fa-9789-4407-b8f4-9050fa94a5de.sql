-- Issue #6 FIX: Prevent Unauthorized Parent-Student Link Creation
-- PRINCIPLE: Teacher-gated link creation to prevent student ID enumeration
-- COMPLIANCE: FERPA requires proper authorization chain for student data access

-- Drop permissive parent INSERT policy
DROP POLICY IF EXISTS "Parents can insert their own links" ON parent_student_links;

-- Create restrictive policy: Only teachers can create links for students in their classrooms
CREATE POLICY "Teachers can create parent-student links"
ON parent_student_links
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT cs.student_id
    FROM classroom_students cs
    JOIN classrooms c ON c.id = cs.classroom_id
    WHERE c.teacher_id = auth.uid()
  )
);

COMMENT ON POLICY "Teachers can create parent-student links" ON parent_student_links 
IS 'SECURITY: Only teachers can create parent-student links after verifying parent identity. Prevents student ID enumeration and unauthorized relationship requests.';