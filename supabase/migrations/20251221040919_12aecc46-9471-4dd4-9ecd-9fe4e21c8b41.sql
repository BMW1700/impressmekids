-- Add due_date and is_posted columns to discussion_topics table
ALTER TABLE public.discussion_topics
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_posted BOOLEAN NOT NULL DEFAULT false;