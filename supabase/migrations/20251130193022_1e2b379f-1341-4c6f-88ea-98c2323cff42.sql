-- Create table for parent personal events (only visible to parent)
CREATE TABLE public.parent_personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for parent-created events for students (visible to both parent and student)
CREATE TABLE public.parent_student_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_personal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_personal_events
-- Parents can view their own personal events
CREATE POLICY "Parents can view their own personal events"
ON public.parent_personal_events
FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- Parents can create their own personal events
CREATE POLICY "Parents can create their own personal events"
ON public.parent_personal_events
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- Parents can update their own personal events
CREATE POLICY "Parents can update their own personal events"
ON public.parent_personal_events
FOR UPDATE
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- Parents can delete their own personal events
CREATE POLICY "Parents can delete their own personal events"
ON public.parent_personal_events
FOR DELETE
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- RLS Policies for parent_student_events
-- Parents can view events they created for their students
-- Students can view events parents created for them
CREATE POLICY "Parents and students can view parent-student events"
ON public.parent_student_events
FOR SELECT
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
  OR
  student_id = auth.uid()
);

-- Parents can create events for their approved students
CREATE POLICY "Parents can create events for their students"
ON public.parent_student_events
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
  AND
  student_id IN (
    SELECT psl.student_id 
    FROM public.parent_student_links psl
    JOIN public.parent_accounts pa ON pa.id = psl.parent_id
    WHERE pa.user_id = auth.uid() AND psl.approved = true
  )
);

-- Parents can update events they created for their students
CREATE POLICY "Parents can update their student events"
ON public.parent_student_events
FOR UPDATE
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- Parents can delete events they created for their students
CREATE POLICY "Parents can delete their student events"
ON public.parent_student_events
FOR DELETE
USING (
  parent_id IN (
    SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_parent_personal_events_parent_date ON public.parent_personal_events(parent_id, event_date);
CREATE INDEX idx_parent_student_events_parent_date ON public.parent_student_events(parent_id, event_date);
CREATE INDEX idx_parent_student_events_student_date ON public.parent_student_events(student_id, event_date);

-- Create trigger for updated_at on parent_personal_events
CREATE TRIGGER update_parent_personal_events_updated_at
BEFORE UPDATE ON public.parent_personal_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on parent_student_events
CREATE TRIGGER update_parent_student_events_updated_at
BEFORE UPDATE ON public.parent_student_events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();