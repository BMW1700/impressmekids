# SOC 2 — Change Management

_Last updated: 2026-06-10._

## Source of truth

- Code: GitHub (managed by Lovable). Every change to production is a commit.
- Schema: `supabase/migrations/` — every migration was approved by a human before execution.
- Secrets: Supabase Vault (no plaintext in source).

## Approval flow

1. AI agent or engineer proposes a change in the Lovable workspace.
2. For schema changes: a migration is generated; the user must explicitly approve before it runs against the database. The approval is timestamped in the workspace history.
3. For code changes: changes are applied to a preview branch and visible in the live preview. The user must publish to promote to production.
4. Publish action writes to `presentation-actions` history; this is the production deploy log.

## Emergency changes

- Hotfixes follow the same flow but may bypass design review. Every hotfix must be followed within 5 business days by a post-mortem entry referencing the migration / commit.

## Evidence

- Git log.
- `supabase/migrations/` filenames carry timestamp + UUID.
- Lovable workspace activity feed.
- `security_audit_log` for any privileged action taken outside the migration flow.
