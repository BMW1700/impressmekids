-- Create table for storing teacher's custom tab order
CREATE TABLE public.classroom_tab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tab_order TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, teacher_id)
);

-- Enable RLS
ALTER TABLE public.classroom_tab_orders ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own tab order
CREATE POLICY "Teachers can view their own tab order"
ON public.classroom_tab_orders
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can insert their own tab order
CREATE POLICY "Teachers can insert their own tab order"
ON public.classroom_tab_orders
FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own tab order
CREATE POLICY "Teachers can update their own tab order"
ON public.classroom_tab_orders
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Teachers can delete their own tab order
CREATE POLICY "Teachers can delete their own tab order"
ON public.classroom_tab_orders
FOR DELETE
USING (auth.uid() = teacher_id);

-- Add trigger for updated_at using existing function
CREATE TRIGGER update_classroom_tab_orders_updated_at
BEFORE UPDATE ON public.classroom_tab_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();