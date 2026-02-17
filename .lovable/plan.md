

# Apply Unique Partial Index for Duplicate Request Prevention

## The Problem
Right now, only the UI prevents a parent from submitting multiple active deletion requests for the same child. There is no database-level constraint, meaning race conditions or direct API calls could create duplicates.

## The Fix
A single database migration that adds a unique partial index:

```sql
CREATE UNIQUE INDEX idx_unique_active_deletion_request 
ON public.data_deletion_requests (student_id) 
WHERE status IN ('pending', 'approved');
```

This ensures only one "pending" or "approved" request can exist per student at any time. Completed and denied requests are unaffected, so historical records are preserved.

## Technical Details

- **One migration file** -- no code changes needed
- The UI already shows a toast error on failure, so if a duplicate insert is attempted, the database rejects it and the user sees a clear error
- This is a non-destructive, additive change with zero risk to existing data

