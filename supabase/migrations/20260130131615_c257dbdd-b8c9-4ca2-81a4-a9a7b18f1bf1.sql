-- Add RLS policy to allow authenticated users to view resources from their own school
CREATE POLICY "Users can view their own school resources"
ON public.school_resources
FOR SELECT
TO authenticated
USING (
  school_id = (
    SELECT school_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);