-- Allow authenticated users to insert stories into reading_library
CREATE POLICY "Authenticated users can insert stories"
ON public.reading_library FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read all stories
CREATE POLICY "Anyone can read stories"
ON public.reading_library FOR SELECT
TO authenticated
USING (true);