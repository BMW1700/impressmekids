-- Create learning_standards table with Common Core standards
CREATE TABLE IF NOT EXISTS public.learning_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assignment_standards mapping table (many-to-many)
CREATE TABLE IF NOT EXISTS public.assignment_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES public.learning_standards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, standard_id)
);

-- Create student_standard_scores table for mastery tracking
CREATE TABLE IF NOT EXISTS public.student_standard_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES public.learning_standards(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  mastery_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, standard_id, classroom_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_standards_grade_subject ON public.learning_standards(grade, subject);
CREATE INDEX IF NOT EXISTS idx_assignment_standards_assignment ON public.assignment_standards(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_standards_standard ON public.assignment_standards(standard_id);
CREATE INDEX IF NOT EXISTS idx_student_standard_scores_student ON public.student_standard_scores(student_id, classroom_id);
CREATE INDEX IF NOT EXISTS idx_student_standard_scores_standard ON public.student_standard_scores(standard_id);

-- Enable RLS
ALTER TABLE public.learning_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_standard_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_standards (readable by all authenticated users)
CREATE POLICY "Anyone can view learning standards"
  ON public.learning_standards FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for assignment_standards
CREATE POLICY "Teachers can manage standards for their assignments"
  ON public.assignment_standards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_standards.assignment_id
      AND a.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_standards.assignment_id
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view standards for their assignments"
  ON public.assignment_standards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classroom_students cs ON cs.classroom_id = a.classroom_id
      WHERE a.id = assignment_standards.assignment_id
      AND cs.student_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view standards for their children's assignments"
  ON public.assignment_standards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classroom_students cs ON cs.classroom_id = a.classroom_id
      JOIN public.parent_student_links psl ON psl.student_id = cs.student_id
      JOIN public.parent_accounts pa ON pa.id = psl.parent_id
      WHERE a.id = assignment_standards.assignment_id
      AND pa.user_id = auth.uid()
      AND psl.approved = true
    )
  );

-- RLS Policies for student_standard_scores
CREATE POLICY "Teachers can view scores for their classroom students"
  ON public.student_standard_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = student_standard_scores.classroom_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update scores for their classroom students"
  ON public.student_standard_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = student_standard_scores.classroom_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update scores for their classroom students update"
  ON public.student_standard_scores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = student_standard_scores.classroom_id
      AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own standard scores"
  ON public.student_standard_scores FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can view their children's standard scores"
  ON public.student_standard_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      JOIN public.parent_accounts pa ON pa.id = psl.parent_id
      WHERE psl.student_id = student_standard_scores.student_id
      AND pa.user_id = auth.uid()
      AND psl.approved = true
    )
  );

-- Pre-populate Common Core standards for K-5
-- Reading Standards
INSERT INTO public.learning_standards (code, grade, subject, category, description) VALUES
('CCSS.ELA.K.RL.1', 0, 'Reading', 'Literature', 'Ask and answer questions about key details in a text'),
('CCSS.ELA.K.RL.2', 0, 'Reading', 'Literature', 'Retell familiar stories, including key details'),
('CCSS.ELA.K.RI.1', 0, 'Reading', 'Informational', 'Ask and answer questions about key details in a text'),
('CCSS.ELA.K.RF.1', 0, 'Reading', 'Foundational', 'Demonstrate understanding of basic features of print'),
('CCSS.ELA.1.RL.1', 1, 'Reading', 'Literature', 'Ask and answer questions about key details in a text'),
('CCSS.ELA.1.RL.2', 1, 'Reading', 'Literature', 'Retell stories and demonstrate understanding of their central message'),
('CCSS.ELA.1.RI.1', 1, 'Reading', 'Informational', 'Ask and answer questions about key details in a text'),
('CCSS.ELA.1.RF.2', 1, 'Reading', 'Foundational', 'Demonstrate understanding of spoken words, syllables, and sounds'),
('CCSS.ELA.2.RL.1', 2, 'Reading', 'Literature', 'Ask and answer questions to demonstrate understanding of key details'),
('CCSS.ELA.2.RL.3', 2, 'Reading', 'Literature', 'Describe how characters respond to major events and challenges'),
('CCSS.ELA.2.RI.2', 2, 'Reading', 'Informational', 'Identify the main topic of a multi-paragraph text'),
('CCSS.ELA.2.RF.3', 2, 'Reading', 'Foundational', 'Know and apply phonics and word analysis skills'),
('CCSS.ELA.3.RL.1', 3, 'Reading', 'Literature', 'Ask and answer questions to demonstrate understanding, referring to text'),
('CCSS.ELA.3.RL.2', 3, 'Reading', 'Literature', 'Recount stories and determine their central message'),
('CCSS.ELA.3.RI.1', 3, 'Reading', 'Informational', 'Ask and answer questions to demonstrate understanding of a text'),
('CCSS.ELA.3.RF.4', 3, 'Reading', 'Foundational', 'Read with sufficient accuracy and fluency to support comprehension'),
('CCSS.ELA.4.RL.1', 4, 'Reading', 'Literature', 'Refer to details and examples when explaining what the text says'),
('CCSS.ELA.4.RL.2', 4, 'Reading', 'Literature', 'Determine theme from details in the text; summarize'),
('CCSS.ELA.4.RI.2', 4, 'Reading', 'Informational', 'Determine the main idea and explain how it is supported by details'),
('CCSS.ELA.4.RF.4', 4, 'Reading', 'Foundational', 'Read with sufficient accuracy and fluency to support comprehension'),
('CCSS.ELA.5.RL.1', 5, 'Reading', 'Literature', 'Quote accurately when explaining what the text says'),
('CCSS.ELA.5.RL.2', 5, 'Reading', 'Literature', 'Determine theme from details; summarize'),
('CCSS.ELA.5.RI.1', 5, 'Reading', 'Informational', 'Quote accurately when explaining what the text says explicitly'),
('CCSS.ELA.5.RF.4', 5, 'Reading', 'Foundational', 'Read with sufficient accuracy and fluency to support comprehension');

-- Writing Standards
INSERT INTO public.learning_standards (code, grade, subject, category, description) VALUES
('CCSS.ELA.K.W.1', 0, 'Writing', 'Opinion', 'Use a combination of drawing, dictating, and writing to compose opinion pieces'),
('CCSS.ELA.K.W.2', 0, 'Writing', 'Informative', 'Use drawing, dictating, and writing to compose informative texts'),
('CCSS.ELA.K.W.3', 0, 'Writing', 'Narrative', 'Use drawing, dictating, and writing to narrate a single event'),
('CCSS.ELA.1.W.1', 1, 'Writing', 'Opinion', 'Write opinion pieces introducing the topic and stating an opinion'),
('CCSS.ELA.1.W.2', 1, 'Writing', 'Informative', 'Write informative texts naming a topic and supplying facts'),
('CCSS.ELA.1.W.3', 1, 'Writing', 'Narrative', 'Write narratives recounting events in proper sequence'),
('CCSS.ELA.2.W.1', 2, 'Writing', 'Opinion', 'Write opinion pieces introducing the topic and providing reasons'),
('CCSS.ELA.2.W.2', 2, 'Writing', 'Informative', 'Write informative texts introducing a topic and using facts'),
('CCSS.ELA.2.W.3', 2, 'Writing', 'Narrative', 'Write narratives recounting a well-elaborated event'),
('CCSS.ELA.3.W.1', 3, 'Writing', 'Opinion', 'Write opinion pieces on topics, supporting a point of view with reasons'),
('CCSS.ELA.3.W.2', 3, 'Writing', 'Informative', 'Write informative texts to examine a topic with facts and definitions'),
('CCSS.ELA.3.W.3', 3, 'Writing', 'Narrative', 'Write narratives to develop real or imagined experiences'),
('CCSS.ELA.4.W.1', 4, 'Writing', 'Opinion', 'Write opinion pieces with reasons and information supporting the point'),
('CCSS.ELA.4.W.2', 4, 'Writing', 'Informative', 'Write informative texts to examine a topic and convey ideas clearly'),
('CCSS.ELA.4.W.3', 4, 'Writing', 'Narrative', 'Write narratives using effective technique and descriptive details'),
('CCSS.ELA.5.W.1', 5, 'Writing', 'Opinion', 'Write opinion pieces with logically ordered reasons supported by facts'),
('CCSS.ELA.5.W.2', 5, 'Writing', 'Informative', 'Write informative texts to examine a topic with relevant information'),
('CCSS.ELA.5.W.3', 5, 'Writing', 'Narrative', 'Write narratives using effective technique and well-chosen details');

-- Math Standards
INSERT INTO public.learning_standards (code, grade, subject, category, description) VALUES
('CCSS.MATH.K.CC.A.1', 0, 'Math', 'Counting', 'Count to 100 by ones and by tens'),
('CCSS.MATH.K.CC.B.4', 0, 'Math', 'Counting', 'Understand the relationship between numbers and quantities'),
('CCSS.MATH.K.OA.A.1', 0, 'Math', 'Operations', 'Represent addition and subtraction with objects and drawings'),
('CCSS.MATH.K.G.A.1', 0, 'Math', 'Geometry', 'Describe objects using names of shapes'),
('CCSS.MATH.1.OA.A.1', 1, 'Math', 'Operations', 'Use addition and subtraction within 20 to solve word problems'),
('CCSS.MATH.1.OA.C.6', 1, 'Math', 'Operations', 'Add and subtract within 20'),
('CCSS.MATH.1.NBT.A.1', 1, 'Math', 'Number', 'Count to 120, starting at any number less than 120'),
('CCSS.MATH.1.MD.A.1', 1, 'Math', 'Measurement', 'Order three objects by length; compare lengths'),
('CCSS.MATH.2.OA.A.1', 2, 'Math', 'Operations', 'Use addition and subtraction within 100 to solve word problems'),
('CCSS.MATH.2.NBT.A.1', 2, 'Math', 'Number', 'Understand place value; hundreds, tens, and ones'),
('CCSS.MATH.2.NBT.B.5', 2, 'Math', 'Number', 'Fluently add and subtract within 100'),
('CCSS.MATH.2.MD.A.1', 2, 'Math', 'Measurement', 'Measure length of an object using appropriate tools'),
('CCSS.MATH.3.OA.A.3', 3, 'Math', 'Operations', 'Use multiplication and division within 100 to solve word problems'),
('CCSS.MATH.3.OA.C.7', 3, 'Math', 'Operations', 'Fluently multiply and divide within 100'),
('CCSS.MATH.3.NF.A.1', 3, 'Math', 'Fractions', 'Understand fractions as numbers'),
('CCSS.MATH.3.MD.A.1', 3, 'Math', 'Measurement', 'Tell and write time to the nearest minute'),
('CCSS.MATH.4.OA.A.3', 4, 'Math', 'Operations', 'Solve multi-step word problems with whole numbers'),
('CCSS.MATH.4.NBT.B.5', 4, 'Math', 'Number', 'Multiply multi-digit numbers'),
('CCSS.MATH.4.NF.A.1', 4, 'Math', 'Fractions', 'Explain equivalence of fractions'),
('CCSS.MATH.4.MD.A.2', 4, 'Math', 'Measurement', 'Use four operations to solve word problems with distance, time, money'),
('CCSS.MATH.5.OA.A.1', 5, 'Math', 'Operations', 'Write and interpret numerical expressions'),
('CCSS.MATH.5.NBT.B.5', 5, 'Math', 'Number', 'Fluently multiply multi-digit whole numbers'),
('CCSS.MATH.5.NF.A.1', 5, 'Math', 'Fractions', 'Add and subtract fractions with unlike denominators'),
('CCSS.MATH.5.MD.C.5', 5, 'Math', 'Measurement', 'Relate volume to multiplication and addition');

-- Function to calculate and update student standard scores
CREATE OR REPLACE FUNCTION update_student_standard_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the submission is graded
  IF NEW.status IN ('graded', 'completed') AND NEW.grade IS NOT NULL THEN
    -- Update or insert scores for each standard mapped to this assignment
    INSERT INTO public.student_standard_scores (
      student_id,
      standard_id,
      classroom_id,
      mastery_percentage,
      assignments_completed,
      last_updated
    )
    SELECT
      NEW.student_id,
      ast.standard_id,
      a.classroom_id,
      COALESCE(
        (
          SELECT AVG(asub.grade)
          FROM public.assignment_submissions asub
          JOIN public.assignments a2 ON a2.id = asub.assignment_id
          JOIN public.assignment_standards ast2 ON ast2.assignment_id = a2.id
          WHERE asub.student_id = NEW.student_id
          AND ast2.standard_id = ast.standard_id
          AND a2.classroom_id = a.classroom_id
          AND asub.status IN ('graded', 'completed')
          AND asub.grade IS NOT NULL
        ),
        NEW.grade
      ) as avg_grade,
      (
        SELECT COUNT(DISTINCT asub.assignment_id)
        FROM public.assignment_submissions asub
        JOIN public.assignments a2 ON a2.id = asub.assignment_id
        JOIN public.assignment_standards ast2 ON ast2.assignment_id = a2.id
        WHERE asub.student_id = NEW.student_id
        AND ast2.standard_id = ast.standard_id
        AND a2.classroom_id = a.classroom_id
        AND asub.status IN ('graded', 'completed')
      ) as completed_count,
      now()
    FROM public.assignment_standards ast
    JOIN public.assignments a ON a.id = ast.assignment_id
    WHERE ast.assignment_id = NEW.assignment_id
    ON CONFLICT (student_id, standard_id, classroom_id)
    DO UPDATE SET
      mastery_percentage = EXCLUDED.mastery_percentage,
      assignments_completed = EXCLUDED.assignments_completed,
      last_updated = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update standard scores when submissions are graded
CREATE TRIGGER update_standard_scores_on_grade
  AFTER INSERT OR UPDATE OF grade, status
  ON public.assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_standard_scores();