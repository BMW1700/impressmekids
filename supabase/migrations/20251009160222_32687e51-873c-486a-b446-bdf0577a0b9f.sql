-- Enable realtime for the assignments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;

-- Enable realtime for assignment_questions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_questions;