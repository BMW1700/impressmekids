-- Create trigger to auto-update student standard scores when assignments are graded
-- This connects the existing update_student_standard_scores() function to assignment submissions
-- When a teacher grades an assignment mapped to standards, student mastery automatically updates

CREATE TRIGGER update_standard_scores_on_submission
  AFTER INSERT OR UPDATE ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_standard_scores();