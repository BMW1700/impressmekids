-- Create parent_drill_responses table for tracking parent confirmations during drills
CREATE TABLE public.parent_drill_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  drill_session_id UUID NOT NULL REFERENCES public.drill_sessions(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('confirmed_safe', 'en_route', 'picked_up', 'needs_help')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id, drill_session_id)
);

-- Enable RLS
ALTER TABLE public.parent_drill_responses ENABLE ROW LEVEL SECURITY;

-- Parents can view their own responses
CREATE POLICY "Parents can view their own drill responses"
ON public.parent_drill_responses
FOR SELECT
USING (parent_id = auth.uid());

-- Parents can insert their own responses
CREATE POLICY "Parents can create their own drill responses"
ON public.parent_drill_responses
FOR INSERT
WITH CHECK (parent_id = auth.uid());

-- Parents can update their own responses
CREATE POLICY "Parents can update their own drill responses"
ON public.parent_drill_responses
FOR UPDATE
USING (parent_id = auth.uid());

-- Teachers and admins can view all responses for drills
CREATE POLICY "Staff can view drill responses"
ON public.parent_drill_responses
FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') OR 
  has_role(auth.uid(), 'admin')
);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_drill_responses;

-- Create indexes for fast lookups
CREATE INDEX idx_parent_drill_responses_drill_session ON public.parent_drill_responses(drill_session_id);
CREATE INDEX idx_parent_drill_responses_student ON public.parent_drill_responses(student_id);

-- Add trigger for updated_at using existing handle_updated_at function
CREATE TRIGGER update_parent_drill_responses_updated_at
BEFORE UPDATE ON public.parent_drill_responses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();