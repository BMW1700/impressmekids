-- Extend clubs table with meeting details
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS meeting_days text[],
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time,
ADD COLUMN IF NOT EXISTS schedule_start_date date,
ADD COLUMN IF NOT EXISTS schedule_end_date date;

-- Create club_join_requests table for student requests
CREATE TABLE IF NOT EXISTS public.club_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  UNIQUE(club_id, student_id)
);

-- Enable RLS
ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_join_requests
CREATE POLICY "Students can view own club requests" ON public.club_join_requests
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create club join requests" ON public.club_join_requests
  FOR INSERT WITH CHECK (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Club owners can view requests for their clubs" ON public.club_join_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

CREATE POLICY "Club owners can update requests for their clubs" ON public.club_join_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

-- Ensure clubs table has proper RLS policies for browsing
CREATE POLICY "Anyone can browse clubs" ON public.clubs
  FOR SELECT USING (true);

-- Function to get pending club join requests
CREATE OR REPLACE FUNCTION public.get_club_pending_requests(_club_id uuid)
RETURNS TABLE (
  id uuid,
  club_id uuid,
  student_id uuid,
  status text,
  requested_at timestamptz,
  student_name text,
  student_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verify caller owns the club
  IF NOT EXISTS (SELECT 1 FROM clubs WHERE clubs.id = _club_id AND owner_id = auth.uid()) THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    cjr.id,
    cjr.club_id,
    cjr.student_id,
    cjr.status,
    cjr.requested_at,
    p.full_name as student_name,
    p.email as student_email
  FROM club_join_requests cjr
  JOIN profiles p ON p.id = cjr.student_id
  WHERE cjr.club_id = _club_id AND cjr.status = 'pending'
  ORDER BY cjr.requested_at ASC;
END;
$$;

-- Function to approve club join request
CREATE OR REPLACE FUNCTION public.approve_club_join_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_club_id uuid;
  v_student_id uuid;
BEGIN
  -- Get request details and verify ownership
  SELECT cjr.club_id, cjr.student_id INTO v_club_id, v_student_id
  FROM club_join_requests cjr
  JOIN clubs c ON c.id = cjr.club_id
  WHERE cjr.id = p_request_id AND c.owner_id = auth.uid() AND cjr.status = 'pending';
  
  IF v_club_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or not authorized');
  END IF;
  
  -- Update request status
  UPDATE club_join_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_request_id;
  
  -- Add student to club_members
  INSERT INTO club_members (club_id, user_id, role)
  VALUES (v_club_id, v_student_id, 'member')
  ON CONFLICT (club_id, user_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to deny club join request
CREATE OR REPLACE FUNCTION public.deny_club_join_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_club_id uuid;
BEGIN
  -- Verify ownership
  SELECT cjr.club_id INTO v_club_id
  FROM club_join_requests cjr
  JOIN clubs c ON c.id = cjr.club_id
  WHERE cjr.id = p_request_id AND c.owner_id = auth.uid() AND cjr.status = 'pending';
  
  IF v_club_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or not authorized');
  END IF;
  
  -- Update request status
  UPDATE club_join_requests
  SET status = 'denied', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get teacher's clubs with member count
CREATE OR REPLACE FUNCTION public.get_teacher_clubs(p_teacher_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  location text,
  meeting_days text[],
  start_time time,
  end_time time,
  schedule_start_date date,
  schedule_end_date date,
  created_at timestamptz,
  member_count bigint,
  pending_request_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.location,
    c.meeting_days,
    c.start_time,
    c.end_time,
    c.schedule_start_date,
    c.schedule_end_date,
    c.created_at,
    COUNT(DISTINCT cm.id) as member_count,
    COUNT(DISTINCT CASE WHEN cjr.status = 'pending' THEN cjr.id END) as pending_request_count
  FROM clubs c
  LEFT JOIN club_members cm ON cm.club_id = c.id
  LEFT JOIN club_join_requests cjr ON cjr.club_id = c.id
  WHERE c.owner_id = p_teacher_id
  GROUP BY c.id
  ORDER BY c.created_at DESC;
END;
$$;