# SOC 2 — Vendor / Subprocessor Management

_Last updated: 2026-06-10._

## Current subprocessors

See `/game/legal/subprocessors` for the user-facing list. The internal due-diligence record:

| Subprocessor | Purpose | SOC 2 / ISO 27001 | DPA on file | Renewal review |
|---|---|---|---|---|
| Supabase (via Lovable Cloud) | DB, auth, storage, functions | SOC 2 Type 2 | Yes (via Lovable terms) | Annual |
| Google Vertex AI | LLM inference (pseudonymized inputs) | SOC 2 Type 2 / ISO 27001 | Google Cloud DPA | Annual |
| Resend | Transactional email | SOC 2 Type 2 | Yes | Annual |
| Sentry | Error monitoring (no student PII) | SOC 2 Type 2 | Yes | Annual |
| Cloudflare | CDN / WAF / DDoS | SOC 2 Type 2 / ISO 27001 | Yes | Annual |
| Datadog | Infra metrics (no student PII) | SOC 2 Type 2 | Yes | Annual |

## Onboarding checklist

Before adding a new subprocessor that may touch student PII:

1. Confirm SOC 2 Type 2 or equivalent report on file.
2. Confirm signed DPA with FERPA + COPPA flow-down provisions.
3. Confirm data residency (US-only for student data unless School consents).
4. Update `/game/legal/subprocessors` page **and** notify all active schools at least 30 days before activation.
5. Add row to the table above.

## Off-boarding

When a subprocessor is removed:
- Confirm written deletion of all data within their contracted SLA.
- Rotate any shared secrets.
- Update the public list and notify schools.
