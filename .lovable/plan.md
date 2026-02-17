

# Fix Parent Data Deletion Portal -- Remaining Issues

## Issue 1: Incomplete CORS Headers (Edge Function)
The `process-data-deletion` edge function is missing required Supabase client platform headers in the CORS config. This can cause browser requests to fail silently.

**Fix**: Update the `corsHeaders` object to include all required headers:
- `x-supabase-client-platform`
- `x-supabase-client-platform-version`  
- `x-supabase-client-runtime`
- `x-supabase-client-runtime-version`

## Issue 2: Duplicate Request Prevention (Database)
Currently only the UI prevents duplicate pending requests for the same child. A parent could bypass this (or race conditions could occur). 

**Fix**: Add a unique partial index on `data_deletion_requests` so only one pending/approved request per student can exist at a time:
```sql
CREATE UNIQUE INDEX idx_unique_active_deletion_request 
ON data_deletion_requests (student_id) 
WHERE status IN ('pending', 'approved');
```

## Issue 3: Admin Panel Name Resolution May Fail
The admin `DeletionRequestsPanel` queries `parent_accounts` and `profiles` tables directly. If RLS blocks the admin from reading those tables, parent/student names silently resolve to "Unknown".

**Fix**: The admin panel already handles this gracefully with fallback text ("Unknown"), and admins should have SELECT policies on those tables. No code change needed -- but worth verifying the admin RLS policies exist for `parent_accounts` and `profiles`. If they don't, we add them in the migration.

## Issue 4: No Parent Notification on Status Change  
Parents have to manually check the portal to see if their request was approved/denied/completed. There's no push or in-app notification.

**Fix**: After the admin approves, denies, or processes a request, insert a record into the existing notification system (if one exists) or add a simple `parent_notifications` insert. This is a nice-to-have and can be deferred -- the portal is functional without it.

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/process-data-deletion/index.ts` | Fix CORS headers to include all required Supabase client headers |
| New migration | Add unique partial index to prevent duplicate active deletion requests per student |
| Verify/add RLS | Confirm admins can read `parent_accounts` and `profiles` for name resolution |

## What's NOT Broken
- Edge function auth (admin role check via `user_roles`) -- correct
- Deletion order and table coverage -- correct  
- Parent-side UI and RLS -- correct
- `verify_jwt = false` with in-code auth -- correct pattern
- Audit logging to `security_audit_log` -- correct

