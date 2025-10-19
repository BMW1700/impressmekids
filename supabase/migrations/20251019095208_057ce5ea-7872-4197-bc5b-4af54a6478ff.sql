-- Enable realtime for parent_access_requests table
ALTER TABLE public.parent_access_requests REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_access_requests;