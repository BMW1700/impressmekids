-- Add composite index for efficient announcement queries
-- This optimizes filtering by classroom_id and created_at together
CREATE INDEX IF NOT EXISTS idx_classroom_announcements_classroom_created 
ON classroom_announcements (classroom_id, created_at DESC);

-- Add individual index on created_at as fallback for other queries
CREATE INDEX IF NOT EXISTS idx_classroom_announcements_created_at 
ON classroom_announcements (created_at DESC);