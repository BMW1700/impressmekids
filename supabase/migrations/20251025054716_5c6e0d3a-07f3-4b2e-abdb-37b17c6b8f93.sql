-- Clear all pending parent access requests
DELETE FROM public.parent_access_requests 
WHERE status = 'pending';