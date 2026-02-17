CREATE UNIQUE INDEX idx_unique_active_deletion_request 
ON public.data_deletion_requests (student_id) 
WHERE status IN ('pending', 'approved');