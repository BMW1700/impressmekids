-- Add RLS policy to allow students to insert their own benchmark results
CREATE POLICY "Students can insert their own benchmark results"
ON public.student_benchmark_results
FOR INSERT
TO public
WITH CHECK (student_id = auth.uid());