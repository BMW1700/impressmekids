-- Create bucket for assignment question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-question-images', 'assignment-question-images', true);

-- RLS policy: Teachers can upload images
CREATE POLICY "Teachers can upload question images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-question-images' AND
  auth.uid() IS NOT NULL
);

-- RLS policy: Anyone can read images (for students viewing questions)
CREATE POLICY "Anyone can view question images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignment-question-images');

-- RLS policy: Teachers can delete their own images
CREATE POLICY "Teachers can delete question images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-question-images' AND
  auth.uid() = owner
);