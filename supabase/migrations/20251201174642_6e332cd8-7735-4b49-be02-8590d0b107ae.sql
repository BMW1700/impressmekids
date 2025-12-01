-- Create RLS policies for emergency_contacts table
-- Students can view their own emergency contacts
CREATE POLICY "Students can view their own emergency contacts"
ON public.emergency_contacts
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Students can create their own emergency contacts
CREATE POLICY "Students can create their own emergency contacts"
ON public.emergency_contacts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Students can update their own emergency contacts
CREATE POLICY "Students can update their own emergency contacts"
ON public.emergency_contacts
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Students can delete their own emergency contacts
CREATE POLICY "Students can delete their own emergency contacts"
ON public.emergency_contacts
FOR DELETE
TO authenticated
USING (auth.uid() = student_id);