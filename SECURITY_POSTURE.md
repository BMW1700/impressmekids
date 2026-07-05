# Yubi Learn — Security Posture Snapshot

_Last reviewed: 2026-06-10. Scope: backend (Supabase / Lovable Cloud)._

This file is a point-in-time, reproducible evidence record for SOC 2 Type 1 / FERPA / COPPA contract readiness conversations. Pair it with `security-memory` (in-app) and the migration history in `supabase/migrations/`.

## Scan headline

| Run | Total findings | `error` | Notable change |
|---|---|---|---|
| Pre-hardening | 255 | 2 | Two storage write-paths permitted any signed-in user to overwrite peers' audio / question images. |
| Post-hardening (this snapshot) | **98** | **0** | All remaining findings are a single linter rule — `SUPA_authenticated_security_definer_function_executable` — and are documented as intentional in `security-memory`. |

## What changed

### Storage
- `aura-audio` (private): re-baselined to 6 policies — student CRUD scoped to `auth.uid()`, teacher SELECT gated by `parent_consents.aura_recording_consent`, admin SELECT for support, `service_role` ALL.
- `assignment-audio` (private): writes path-scoped to `<auth.uid()>/...`. Removed the legacy "any authenticated user can upload" path.
- `assignment-question-images` (private): writes require `is_classroom_teacher(auth.uid(), <path classroom id>)`. Reads via `qimg_read_classroom_members` (teacher / enrolled student / admin).
- `avatars`, `campaign-assets`, `email-assets`, `world-backgrounds` (public, direct-URL only): broad `SELECT (bucket_id = 'X')` policies removed so the bucket can no longer be listed. Public direct-URL serving still works via the bucket's `public = true` flag.

### RLS
- All 12 service-role-only INSERT/UPDATE policies that used `WITH CHECK (true)` rewritten as `TO service_role WITH CHECK (true)`.
- Removed three over-permissive `tq_*` policies on `tournament_questions` that allowed tournament players to insert/delete questions. Teachers retain full control of their tournament question pool.
- `email_failures`: added `service_role` INSERT (so the worker can record failures) and admin DELETE.

### SECURITY DEFINER functions (124 total in `public`)
For every one of them:
1. `SET search_path = public, pg_temp` (closes the function-search-path-mutable class).
2. `REVOKE ALL ... FROM PUBLIC, anon` — no anonymous execution anywhere.
3. Trigger functions: `REVOKE ALL ... FROM authenticated` — only triggers fire them.
4. Non-trigger functions: `GRANT EXECUTE ... TO authenticated` — intentionally callable by signed-in users because RLS policies and PostgREST RPCs depend on them.
5. `GRANT EXECUTE ... TO service_role` — always.

### App-layer (already in place before this audit)
- `sentry.ts`: `replaysSessionSampleRate = 0` by default. Only `setStudentMode(false)` (non-student roles) opts in to session replay. COPPA-safe.
- `supabase/functions/_shared/pseudonymize.ts`: stripes names / emails / IDs from any string before it is sent to a third-party LLM. Wired into `generate-teacher-summary`.
- `school_settings` row exposes: `school_mode_enabled`, `pseudonymize_ai_requests`, `audio_retention_days = 90`, `data_retention_months = 24`, `disable_session_replay_for_students` — all default `true`.
- `data_export_requests` table backs parent / teacher / admin self-service data export.

## Outstanding accepted risks

1. **98 × `SUPA_authenticated_security_definer_function_executable` (warn).** Every SECURITY DEFINER in `public` remains callable by `authenticated`. This is intentional — see `security-memory` for the full justification. The fix path the linter suggests (revoke from `authenticated`) would break every RLS policy that relies on `has_role()` / `is_classroom_*()` helpers as well as legitimate PostgREST RPCs.
2. **`realtime.messages_*` partitions** lack RLS. Managed by Supabase Realtime; cannot be modified from project migrations. Channel-level authorization is configured in Lovable Cloud project settings.

## Reproducing this snapshot

```
# Re-run the scan:
#   security--run_security_scan
#
# Re-run the linter:
#   supabase--linter
#
# Expected count: 98, all of finding id SUPA_authenticated_security_definer_function_executable.
```

## Cross-references

- `mem://compliance/school-contract-hardening-phase1` — Phase 1 compliance work (school_settings flags, AI pseudonymization, data exports).
- `mem://security/database-rls-and-audit-hardening` — RLS philosophy + audit log hash chain.
- `mem://security/zero-plaintext-password-policy` — credential storage rule.
- `mem://security/xss-sanitization-standard` — frontend escape rule.
