# SOC 2 — Access Control

_Last updated: 2026-06-10. Owner: Security._

## Identity

- All human users authenticate through Supabase Auth (email/password with HIBP leaked-password check, Google SSO, Apple SSO, Clever SSO).
- MFA is **required** for teacher, admin, district_admin, and parent roles. Enforced at the route level via `RequireMFA` and at the data layer via `has_verified_mfa(uid)` security-definer helper.
- Student accounts cannot self-register; they are provisioned by a teacher/admin after verified parental consent. Game-mode players can self-register but receive only Game Mode data scope.
- Service accounts: only `service_role` (Supabase) is used by edge functions. The key is rotated on suspected compromise via `supabase--rotate_api_keys`.

## Authorization model

- Roles live in `public.user_roles`, never on `profiles`. Membership is checked via `has_role(uid, role)` (SECURITY DEFINER, `search_path = public, pg_temp`).
- Every Data-API-reachable table in `public` has RLS enabled and explicit GRANTs. `service_role` retains full access for edge functions only.
- Storage buckets:
  - Private + path-scoped to `auth.uid()`: `aura-audio`, `assignment-audio`.
  - Private + classroom-scoped via `is_classroom_teacher()`: `assignment-question-images`.
  - Public direct-URL only (listing disabled): `avatars`, `campaign-assets`, `email-assets`, `world-backgrounds`.

## Engineering access

- Lovable IDE → Supabase managed connection; no engineer has the database password.
- All schema changes ship as approved migrations in `supabase/migrations/`. Git history is the change-management ledger.
- Production secrets stored in Supabase Vault / Edge Function secrets — never in source.

## Review cadence

- Quarterly: list all `user_roles` rows for `admin`, `district_admin`, `service_role` access. Confirm each is current.
- Quarterly: re-run `security--run_security_scan` + `supabase--linter`. Diff against last quarter.
- Annually: external pen-test (planned).

## Evidence

- `supabase/migrations/*` — full schema and policy history.
- `SECURITY_POSTURE.md` — current snapshot.
- `security_audit_log` (hash-chained, SHA-256) — admin actions.
- Supabase auth logs — sign-in events, MFA enrollments.
