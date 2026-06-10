# SOC 2 — Logging & Monitoring

_Last updated: 2026-06-10._

## What we log

| Source | Sink | Retention |
|---|---|---|
| Auth events (sign-in, MFA, password reset) | Supabase auth logs | 90 days |
| Admin / privileged actions | `security_audit_log` (hash-chained) | 7 years |
| Safety / SSVRS events | `safety_audit_log` (hash-chained) | 7 years |
| Edge function logs | Supabase function logs | 30 days |
| Application errors | Sentry (PII scrubbed, replay off for students) | 90 days |
| Infra metrics | Datadog | 15 months |

## Tamper detection

`security_audit_log` and `safety_audit_log` use SHA-256 hash chaining: each row stores `prev_hash` + `row_hash`. Background job `verify_audit_chain()` runs nightly and alerts on any broken link.

## Alerting

- Sentry → on-call rotation for new error spikes.
- Datadog → infra anomalies (CPU, latency, 5xx rate).
- Custom Postgres alerts (`check-student-signin-rate`) for credential-stuffing patterns.
- `escalation-engine` → safety SLAs across the 4-tier SSVRS model.

## Access to logs

- Engineers: read-only via Supabase / Sentry / Datadog consoles, scoped to least-privilege.
- Auditors: per-engagement read-only access, time-limited.
- Schools: receive incident summaries; raw logs available on request via DPA.
