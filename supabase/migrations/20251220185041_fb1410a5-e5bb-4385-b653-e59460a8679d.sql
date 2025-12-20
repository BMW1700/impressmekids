-- Create function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create table for parent meeting bookings with teachers
CREATE TABLE public.meeting_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_hours_id UUID NOT NULL REFERENCES public.teacher_office_hours(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_reason TEXT,
  status TEXT NOT NULL DEFAULT 'booked',
  parent_event_id UUID REFERENCES public.parent_student_events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_meeting_bookings_office_hours ON public.meeting_bookings(office_hours_id);
CREATE INDEX idx_meeting_bookings_teacher ON public.meeting_bookings(teacher_id);
CREATE INDEX idx_meeting_bookings_parent ON public.meeting_bookings(parent_id);
CREATE INDEX idx_meeting_bookings_date ON public.meeting_bookings(booking_date);

-- Unique constraint to prevent double-booking
CREATE UNIQUE INDEX idx_meeting_bookings_unique_slot ON public.meeting_bookings(office_hours_id, booking_date, start_time) WHERE status = 'booked';

-- Parents can view their own bookings
CREATE POLICY "Parents can view their own bookings" 
ON public.meeting_bookings 
FOR SELECT 
USING (parent_id IN (SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()));

-- Parents can create their own bookings
CREATE POLICY "Parents can create their own bookings" 
ON public.meeting_bookings 
FOR INSERT 
WITH CHECK (parent_id IN (SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()));

-- Parents can cancel their own bookings
CREATE POLICY "Parents can update their own bookings" 
ON public.meeting_bookings 
FOR UPDATE 
USING (parent_id IN (SELECT id FROM public.parent_accounts WHERE user_id = auth.uid()));

-- Teachers can view bookings for their office hours
CREATE POLICY "Teachers can view their meeting bookings" 
ON public.meeting_bookings 
FOR SELECT 
USING (teacher_id = auth.uid());

-- Teachers can update bookings for their office hours
CREATE POLICY "Teachers can update their meeting bookings" 
ON public.meeting_bookings 
FOR UPDATE 
USING (teacher_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_meeting_bookings_updated_at
BEFORE UPDATE ON public.meeting_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();