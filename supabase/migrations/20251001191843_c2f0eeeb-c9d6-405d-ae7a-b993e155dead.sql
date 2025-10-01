-- Create enums for difficulty and question types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'matching');

-- Add new columns to questions table
ALTER TABLE questions 
ADD COLUMN difficulty difficulty_level DEFAULT 'medium',
ADD COLUMN question_type question_type DEFAULT 'short_answer',
ADD COLUMN image_url TEXT,
ADD COLUMN audio_url TEXT,
ADD COLUMN explanation TEXT,
ADD COLUMN options JSONB DEFAULT '[]'::jsonb;

-- Update grade column comment to clarify 0 = Kindergarten, 1-12 = Grades 1-12
COMMENT ON COLUMN questions.grade IS 'Grade level: 0 for Kindergarten, 1-12 for grades 1-12';

-- Insert sample K-12 questions across different subjects and grades
INSERT INTO questions (question_text, answer_text, grade, subject, difficulty, question_type, explanation, options, metadata) VALUES

-- Kindergarten (grade 0)
('What color is the sky on a sunny day?', 'blue', 0, 'Science', 'easy', 'multiple_choice', 'The sky appears blue because of how sunlight scatters in the atmosphere.', '["blue", "red", "green", "yellow"]', '{"grade_name": "Kindergarten", "topic": "Colors and Nature"}'),
('How many legs does a dog have?', '4', 0, 'Math', 'easy', 'short_answer', 'Dogs are animals with four legs, which helps them run and walk.', '[]', '{"grade_name": "Kindergarten", "topic": "Counting and Animals"}'),
('What shape is a ball?', 'circle', 0, 'Math', 'easy', 'multiple_choice', 'A ball is round like a circle or sphere.', '["circle", "square", "triangle", "rectangle"]', '{"grade_name": "Kindergarten", "topic": "Shapes"}'),

-- Grade 1
('What is 5 + 3?', '8', 1, 'Math', 'easy', 'short_answer', 'When you add 5 and 3 together, you get 8.', '[]', '{"topic": "Addition"}'),
('How many days are in a week?', '7', 1, 'General Knowledge', 'easy', 'short_answer', 'A week has seven days: Sunday through Saturday.', '[]', '{"topic": "Time"}'),
('What sound does a cow make?', 'moo', 1, 'Science', 'easy', 'short_answer', 'Cows make a mooing sound.', '[]', '{"topic": "Animals"}'),

-- Grade 2
('What is 12 - 7?', '5', 2, 'Math', 'easy', 'short_answer', 'When you subtract 7 from 12, you get 5.', '[]', '{"topic": "Subtraction"}'),
('What do plants need to grow?', 'water and sunlight', 2, 'Science', 'medium', 'short_answer', 'Plants need water, sunlight, air, and nutrients to grow healthy.', '[]', '{"topic": "Plant Life"}'),
('How many cents make a dollar?', '100', 2, 'Math', 'medium', 'short_answer', 'One dollar equals 100 cents.', '[]', '{"topic": "Money"}'),

-- Grade 3
('What is 8 × 7?', '56', 3, 'Math', 'medium', 'short_answer', '8 multiplied by 7 equals 56.', '[]', '{"topic": "Multiplication"}'),
('What is the capital of the United States?', 'Washington D.C.', 3, 'Social Studies', 'medium', 'short_answer', 'Washington D.C. is the capital city of the United States.', '[]', '{"topic": "Geography"}'),
('What are the three states of matter?', 'solid, liquid, and gas', 3, 'Science', 'medium', 'short_answer', 'Matter exists in three main states: solid, liquid, and gas.', '[]', '{"topic": "Matter"}'),

-- Grade 6
('What is the square root of 144?', '12', 6, 'Math', 'medium', 'short_answer', '12 × 12 = 144, so the square root of 144 is 12.', '[]', '{"topic": "Square Roots"}'),
('What is photosynthesis?', 'process plants use to make food from sunlight', 6, 'Science', 'medium', 'short_answer', 'Photosynthesis is how plants convert light energy into chemical energy (food).', '[]', '{"topic": "Biology"}'),
('Who wrote Romeo and Juliet?', 'William Shakespeare', 6, 'English', 'medium', 'short_answer', 'William Shakespeare wrote this famous tragedy in the 1590s.', '[]', '{"topic": "Literature"}'),

-- Grade 7
('What is 15% of 200?', '30', 7, 'Math', 'medium', 'short_answer', 'To find 15% of 200: (15/100) × 200 = 30.', '[]', '{"topic": "Percentages"}'),
('What is the powerhouse of the cell?', 'mitochondria', 7, 'Science', 'medium', 'short_answer', 'Mitochondria produce energy (ATP) for the cell.', '[]', '{"topic": "Cell Biology"}'),

-- Grade 8
('Solve for x: 2x + 5 = 13', '4', 8, 'Math', 'medium', 'short_answer', 'Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4.', '[]', '{"topic": "Algebra"}'),
('What year did World War II end?', '1945', 8, 'History', 'medium', 'short_answer', 'World War II ended in 1945 with the surrender of Japan.', '[]', '{"topic": "World History"}'),

-- Grade 9
('What is the chemical formula for water?', 'H2O', 9, 'Science', 'easy', 'short_answer', 'Water consists of two hydrogen atoms and one oxygen atom.', '[]', '{"topic": "Chemistry"}'),
('What is the Pythagorean theorem?', 'a² + b² = c²', 9, 'Math', 'medium', 'short_answer', 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.', '[]', '{"topic": "Geometry"}'),

-- Grade 10
('Who painted the Mona Lisa?', 'Leonardo da Vinci', 10, 'Art', 'easy', 'short_answer', 'Leonardo da Vinci painted this famous portrait during the Renaissance.', '[]', '{"topic": "Art History"}'),
('What is the derivative of x²?', '2x', 10, 'Math', 'hard', 'short_answer', 'Using the power rule, the derivative of x² is 2x.', '[]', '{"topic": "Calculus"}'),

-- Grade 11
('What is the speed of light in a vacuum?', '299,792,458 meters per second', 11, 'Science', 'hard', 'short_answer', 'The speed of light in a vacuum is approximately 3 × 10⁸ m/s or 299,792,458 m/s.', '[]', '{"topic": "Physics"}'),
('Who wrote "To Kill a Mockingbird"?', 'Harper Lee', 11, 'English', 'medium', 'short_answer', 'Harper Lee published this classic American novel in 1960.', '[]', '{"topic": "Literature"}'),

-- Grade 12
('What is the integral of 1/x?', 'ln|x| + C', 12, 'Math', 'hard', 'short_answer', 'The integral of 1/x is the natural logarithm of the absolute value of x, plus a constant.', '[]', '{"topic": "Calculus"}'),
('What is DNA replication?', 'process of copying DNA molecules', 12, 'Science', 'hard', 'short_answer', 'DNA replication is the biological process of producing two identical copies of DNA from one original DNA molecule.', '[]', '{"topic": "Molecular Biology"}');