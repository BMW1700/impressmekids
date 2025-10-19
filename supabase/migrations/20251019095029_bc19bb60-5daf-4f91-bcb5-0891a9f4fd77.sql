-- Add parent_notified field to track if parent has seen the status update
ALTER TABLE public.parent_access_requests
ADD COLUMN parent_notified boolean NOT NULL DEFAULT false;