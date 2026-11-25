ALTER FUNCTION public.move_to_dlq(text,text,int8,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text,int4,int4) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text,int8) SET search_path = public, pgmq;
DROP POLICY IF EXISTS "All authenticated users can view curriculum anchors" ON public.curriculum_anchors;
DROP POLICY IF EXISTS "Authenticated users can insert safety logs" ON public.safety_verification_log;
CREATE POLICY "Users can insert their own safety logs" ON public.safety_verification_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
DROP POLICY IF EXISTS "Anyone signed in can read redub jobs" ON public.prek_redub_jobs;
DROP POLICY IF EXISTS "Service role has full access to audio storage" ON storage.objects;