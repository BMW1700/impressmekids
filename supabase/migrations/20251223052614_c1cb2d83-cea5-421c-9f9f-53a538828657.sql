-- Fix parent_consents INSERT RLS policy to correctly map auth.uid() -> parent_accounts.user_id

-- Ensure RLS is enabled
ALTER TABLE public.parent_consents ENABLE ROW LEVEL SECURITY;

-- Drop the broken INSERT policy (if it exists)
DROP POLICY IF EXISTS "Parents can insert consent for their students" ON public.parent_consents;

-- Recreate corrected INSERT policy
CREATE POLICY "Parents can insert consent for their students"
ON public.parent_consents
FOR INSERT
WITH CHECK (
  -- parent_consents.parent_id references parent_accounts.id
  EXISTS (
    SELECT 1
    FROM public.parent_accounts pa
    WHERE pa.id = parent_consents.parent_id
      AND pa.user_id = auth.uid()
  )
  AND
  -- Parent must have an approved link to the student
  EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    WHERE psl.parent_id = parent_consents.parent_id
      AND psl.student_id = parent_consents.student_id
      AND psl.approved = true
  )
);
