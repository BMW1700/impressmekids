# SOC 2 — Business Continuity & Disaster Recovery

_Last updated: 2026-06-10._

## Backups

- **Hot:** Supabase managed Postgres point-in-time recovery, 30 days.
- **Cold:** Monthly encrypted snapshots written to `cold_storage_backups` via `create-cold-storage-backup`. Retained 7 years for audit logs, 24 months for learning data.
- **Health check:** `check-backup-health` edge function runs daily; failures page the on-call engineer.

## Recovery objectives

| Scenario | RTO | RPO |
|---|---|---|
| Single edge function failure | 15 min | 0 |
| Database read replica failure | 30 min | < 1 min |
| Full region outage | 4 hours | < 5 min (PITR) |
| Catastrophic data loss | 24 hours | 24 hours (last cold snapshot) |

## Restore procedure

1. Confirm scope of loss in `backup_audit_log`.
2. Use `restore-cold-storage-backup` for a clean snapshot, or PITR via Supabase dashboard / API.
3. Verify integrity: re-run `security--run_security_scan` + `supabase--linter`; spot-check `security_audit_log` hash chain.
4. Notify affected schools per `/game/legal/incident-response`.

## Tested

- Quarterly: tabletop exercise restoring last cold backup to a sandbox project.
- Annually: full game-day drill including DNS cutover.
