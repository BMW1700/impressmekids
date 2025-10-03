-- Drop existing tournament RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "t_insert" ON public.tournaments;
DROP POLICY IF EXISTS "t_select_teacher" ON public.tournaments;
DROP POLICY IF EXISTS "t_update" ON public.tournaments;

-- Recreate policies using the security definer function to break recursion
CREATE POLICY "t_insert" 
ON public.tournaments 
FOR INSERT 
WITH CHECK (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "t_select_teacher" 
ON public.tournaments 
FOR SELECT 
USING (public.is_classroom_teacher(auth.uid(), classroom_id));

CREATE POLICY "t_update" 
ON public.tournaments 
FOR UPDATE 
USING (public.is_classroom_teacher(auth.uid(), classroom_id));