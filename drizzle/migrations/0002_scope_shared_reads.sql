CREATE OR REPLACE FUNCTION public.can_view_teacher_office_hours(_teacher_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() = _teacher_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'teacher'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.classrooms c
      JOIN public.classroom_students cs ON cs.classroom_id = c.id
      WHERE c.teacher_id = _teacher_id
        AND public.is_parent_of_student(auth.uid(), cs.student_id)
    )
$$;
DROP POLICY IF EXISTS "Authenticated users can view office hours" ON public.teacher_office_hours;
CREATE POLICY "Linked users can view office hours" ON public.teacher_office_hours FOR SELECT TO authenticated USING (public.can_view_teacher_office_hours(teacher_id));
DROP POLICY IF EXISTS "village_items readable by all" ON public.village_items;
CREATE POLICY "village_items readable by signed-in users" ON public.village_items FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "village_zones readable by all" ON public.village_zones;
CREATE POLICY "village_zones readable by signed-in users" ON public.village_zones FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can view school settings" ON public.school_settings;
CREATE POLICY "Signed-in users can view school settings" ON public.school_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);