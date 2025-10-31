-- Make classroom_id nullable in events table
ALTER TABLE public.events ALTER COLUMN classroom_id DROP NOT NULL;

-- Update RLS policy for students to only show posted events in their classrooms
DROP POLICY IF EXISTS "Students can view posted events in their classrooms" ON public.events;
CREATE POLICY "Students can view posted events in their classrooms"
ON public.events
FOR SELECT
USING (
  is_posted = true 
  AND classroom_id IS NOT NULL 
  AND is_classroom_student(auth.uid(), classroom_id)
);

-- Update RLS policy for parents to only show posted events for their children's classrooms
DROP POLICY IF EXISTS "Parents can view posted events for their children" ON public.events;
CREATE POLICY "Parents can view posted events for their children"
ON public.events
FOR SELECT
USING (
  is_posted = true 
  AND classroom_id IS NOT NULL 
  AND classroom_id IN (
    SELECT cs.classroom_id
    FROM classroom_students cs
    JOIN parent_student_links psl ON psl.student_id = cs.student_id
    JOIN parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() AND psl.approved = true
  )
);