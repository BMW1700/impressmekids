
-- =============================================
-- DISCUSSION BOARDS SYSTEM
-- =============================================

-- Discussion topics table
CREATE TABLE public.discussion_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Discussion posts (replies with threading support)
CREATE TABLE public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.discussion_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for discussion boards
CREATE INDEX idx_discussion_topics_classroom ON public.discussion_topics(classroom_id);
CREATE INDEX idx_discussion_posts_topic ON public.discussion_posts(topic_id);
CREATE INDEX idx_discussion_posts_parent ON public.discussion_posts(parent_id);

-- RLS for discussion_topics
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage discussion topics in their classrooms"
ON public.discussion_topics FOR ALL
USING (is_classroom_teacher(auth.uid(), classroom_id))
WITH CHECK (is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Students can view discussion topics in their classrooms"
ON public.discussion_topics FOR SELECT
USING (is_classroom_student(auth.uid(), classroom_id));

CREATE POLICY "Students can create discussion topics"
ON public.discussion_topics FOR INSERT
WITH CHECK (is_classroom_student(auth.uid(), classroom_id) AND created_by = auth.uid());

-- RLS for discussion_posts
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts in topics they can access"
ON public.discussion_posts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM discussion_topics dt
  WHERE dt.id = discussion_posts.topic_id
  AND (is_classroom_teacher(auth.uid(), dt.classroom_id) OR is_classroom_student(auth.uid(), dt.classroom_id))
));

CREATE POLICY "Users can create posts in unlocked topics"
ON public.discussion_posts FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM discussion_topics dt
    WHERE dt.id = discussion_posts.topic_id
    AND dt.is_locked = false
    AND (is_classroom_teacher(auth.uid(), dt.classroom_id) OR is_classroom_student(auth.uid(), dt.classroom_id))
  )
);

CREATE POLICY "Users can update their own posts"
ON public.discussion_posts FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Teachers can delete any post in their classroom"
ON public.discussion_posts FOR DELETE
USING (EXISTS (
  SELECT 1 FROM discussion_topics dt
  WHERE dt.id = discussion_posts.topic_id
  AND is_classroom_teacher(auth.uid(), dt.classroom_id)
));

-- =============================================
-- RUBRICS SYSTEM
-- =============================================

-- Rubrics table
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rubric criteria (rows in the rubric)
CREATE TABLE public.rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_points INTEGER NOT NULL DEFAULT 10,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rubric levels (columns for each criteria - e.g., Excellent, Good, Fair, Poor)
CREATE TABLE public.rubric_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_id UUID NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link rubrics to assignments
CREATE TABLE public.assignment_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id)
);

-- Store rubric scores for submissions
CREATE TABLE public.rubric_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES public.rubric_criteria(id),
  level_id UUID REFERENCES public.rubric_levels(id),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(submission_id, criteria_id)
);

-- Indexes for rubrics
CREATE INDEX idx_rubrics_classroom ON public.rubrics(classroom_id);
CREATE INDEX idx_rubric_criteria_rubric ON public.rubric_criteria(rubric_id);
CREATE INDEX idx_rubric_levels_criteria ON public.rubric_levels(criteria_id);
CREATE INDEX idx_assignment_rubrics_assignment ON public.assignment_rubrics(assignment_id);
CREATE INDEX idx_rubric_scores_submission ON public.rubric_scores(submission_id);

-- RLS for rubrics
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage rubrics in their classrooms"
ON public.rubrics FOR ALL
USING (is_classroom_teacher(auth.uid(), classroom_id))
WITH CHECK (is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "Students can view rubrics in their classrooms"
ON public.rubrics FOR SELECT
USING (is_classroom_student(auth.uid(), classroom_id));

-- RLS for rubric_criteria
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage criteria for their rubrics"
ON public.rubric_criteria FOR ALL
USING (EXISTS (SELECT 1 FROM rubrics r WHERE r.id = rubric_criteria.rubric_id AND is_classroom_teacher(auth.uid(), r.classroom_id)))
WITH CHECK (EXISTS (SELECT 1 FROM rubrics r WHERE r.id = rubric_criteria.rubric_id AND is_classroom_teacher(auth.uid(), r.classroom_id)));

CREATE POLICY "Students can view criteria for classroom rubrics"
ON public.rubric_criteria FOR SELECT
USING (EXISTS (SELECT 1 FROM rubrics r WHERE r.id = rubric_criteria.rubric_id AND is_classroom_student(auth.uid(), r.classroom_id)));

-- RLS for rubric_levels
ALTER TABLE public.rubric_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage levels for their rubrics"
ON public.rubric_levels FOR ALL
USING (EXISTS (
  SELECT 1 FROM rubric_criteria rc
  JOIN rubrics r ON r.id = rc.rubric_id
  WHERE rc.id = rubric_levels.criteria_id AND is_classroom_teacher(auth.uid(), r.classroom_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM rubric_criteria rc
  JOIN rubrics r ON r.id = rc.rubric_id
  WHERE rc.id = rubric_levels.criteria_id AND is_classroom_teacher(auth.uid(), r.classroom_id)
));

CREATE POLICY "Students can view levels for classroom rubrics"
ON public.rubric_levels FOR SELECT
USING (EXISTS (
  SELECT 1 FROM rubric_criteria rc
  JOIN rubrics r ON r.id = rc.rubric_id
  WHERE rc.id = rubric_levels.criteria_id AND is_classroom_student(auth.uid(), r.classroom_id)
));

-- RLS for assignment_rubrics
ALTER TABLE public.assignment_rubrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage assignment rubrics"
ON public.assignment_rubrics FOR ALL
USING (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_rubrics.assignment_id AND a.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_rubrics.assignment_id AND a.teacher_id = auth.uid()));

CREATE POLICY "Students can view assignment rubrics"
ON public.assignment_rubrics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM assignments a
  WHERE a.id = assignment_rubrics.assignment_id AND is_classroom_student(auth.uid(), a.classroom_id)
));

-- RLS for rubric_scores
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage rubric scores"
ON public.rubric_scores FOR ALL
USING (EXISTS (
  SELECT 1 FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE s.id = rubric_scores.submission_id AND a.teacher_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM assignment_submissions s
  JOIN assignments a ON a.id = s.assignment_id
  WHERE s.id = rubric_scores.submission_id AND a.teacher_id = auth.uid()
));

CREATE POLICY "Students can view their own rubric scores"
ON public.rubric_scores FOR SELECT
USING (EXISTS (
  SELECT 1 FROM assignment_submissions s
  WHERE s.id = rubric_scores.submission_id AND s.student_id = auth.uid()
));
