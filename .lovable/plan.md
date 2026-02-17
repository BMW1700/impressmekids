

# Security and Stability Hardening -- All 3 Priorities

## Priority 1: Shared CORS Module + Update All Edge Functions

Create one shared file and update all edge functions to use it.

**New file:** `supabase/functions/_shared/cors.ts`
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

**Update ~35 edge functions** to replace their local `corsHeaders` definition with:
```typescript
import { corsHeaders } from '../_shared/cors.ts';
```

This is a mechanical find-and-replace across every function. No logic changes.

---

## Priority 2: Fix verify_jwt in config.toml

Change `verify_jwt = true` to `verify_jwt = false` for all 28 functions that already do in-code JWT validation. This eliminates the gateway/code auth conflict.

Affected functions: list-cold-storage-backups, restore-cold-storage-backup, request-data-restoration, check-backup-health, generate-teacher-summary, start-tournament, seed-and-create-matches, start-round, show-next-question, buzz-in, submit-answer, end-round-and-compute-winners, generate-question-ai, analyze-aura, generate-practice-exercises, calculate-exercise-effectiveness, extract-text-from-image, train-ml-models, update-q-learning, send-drill-notification, delete-user-account, send-safety-alert, send-risk-alerts, report-emergency, escalation-engine, send-substitute-access-email, send-phoneme-report, bulk-create-students

---

## Priority 3: Fix Permissive RLS Policies

**Critical fix -- `user_roles` table:** Replace the open `WITH CHECK (true)` ALL policy with an admin-only check:
```sql
DROP POLICY IF EXISTS "..." ON public.user_roles;
CREATE POLICY "Only admins can manage user_roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

**Audit remaining 11 tables:** For tables only written to by service-role edge functions (like `security_audit_log`, `backup_audit_log`, `safety_audit_log`, `aura_access_log`), the permissive policies are harmless since service role bypasses RLS. These will be reviewed and either tightened or documented as intentional.

---

## Execution Order

1. Create shared CORS module
2. Update all edge functions to use shared CORS (batch of parallel edits)
3. Update config.toml (single file edit)
4. Database migration for RLS fixes
5. Deploy all edge functions
6. Verify with test calls

## Risk Assessment

| Change | Risk | Reversible |
|--------|------|------------|
| Shared CORS module | None | Yes |
| Edge function CORS imports | None | Yes |
| verify_jwt = false | None (code auth remains) | Yes |
| user_roles RLS fix | Low (verify admin creation flows) | Yes |
| Audit log RLS review | None (service role bypasses) | Yes |

