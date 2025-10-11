-- Drop the incorrect grade constraint (0-12)
ALTER TABLE aura_records DROP CONSTRAINT IF EXISTS aura_records_grade_check;

-- Add the correct constraint for 0-100 grading scale
ALTER TABLE aura_records ADD CONSTRAINT aura_records_grade_check 
CHECK ((grade >= 0) AND (grade <= 100));