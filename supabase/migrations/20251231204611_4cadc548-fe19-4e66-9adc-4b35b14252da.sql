-- Allow public read access to schools for registration flow
CREATE POLICY "Anyone can view schools"
  ON schools
  FOR SELECT
  USING (true);