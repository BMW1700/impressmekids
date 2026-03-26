

# Brutally Honest Post-Fix Audit — March 26, 2026

## What Got Fixed (Confirmed Gone from Scan)
- District privilege escalation — FIXED
- Backup audit log public INSERT — FIXED
- Safety audit log public INSERT — FIXED
- Schools INSERT tautology — FIXED
- Parent profile view without approved check — FIXED

## What's Still Broken: 5 ERRORS, 2 WARNINGS

### ERRORS (Must fix)

| # | Finding | Table | Why It's Still Here |
|---|---------|-------|---------------------|
| 1 | **Consent records still updatable by anyone** — Migration 6 re-added `USING (true)` for `{anon, authenticated}` | `student_signup_consents` | Last migration partially regressed the fix. The `WITH CHECK` constraints help but `USING (true)` means any row is targetable |
| 2 | **Any user can insert behavior stats for any student** — INSERT `{public}` WITH CHECK `(true)` | `student_behavior_stats` | Was never in the migration plan |
| 3 | **Any user can insert risk alert notifications** — INSERT `{public}` WITH CHECK `(true)` | `risk_alert_notifications` | Was never in the migration plan |
| 4 | **Any user can insert risk history for any student** — INSERT `{public}` WITH CHECK `(true)` | `student_risk_history` | Was in original plan but migration was skipped |
| 5 | **Any user can insert practice exercises for any student** — INSERT `{public}` WITH CHECK `(true)` | `practice_exercises` | Was in original plan but migration was skipped |

### WARNINGS (Lower priority)

| # | Finding | Table |
|---|---------|-------|
| 1 | Any user can insert game rounds | `game_rounds` |
| 2 | Any user can insert/update game player records | `game_players` |

### 9 Warnings (Acceptable)
The remaining 9 `SUPA_rls_policy_always_true` warnings are on service-role-managed audit/system tables — these are expected false positives.

## Did the fixes break RPG or AURA?

**No. Zero app code was touched.** All 6 migrations were purely RLS policy changes. RPGBattleArena.tsx, useMLIntegration.ts, crossModalTransferNetwork.ts, cmuDictWrapper.ts, and all AURA recording components are completely untouched.

## Compliance Scorecard (Updated)

```text
COPPA Parental Consent Flow    ⚠️  IMPROVED but USING(true) still present
COPPA Data Deletion Portal     ✅ Working
COPPA Under-13 Age Gate        ✅ Working
FERPA Student PII Protection   ✅ District escalation FIXED
FERPA Audit Trail Integrity    ✅ Audit log injection FIXED
FERPA Role-Based Access        ✅ Working (538+ RLS policies)
SOC 2 Access Controls          ⚠️  5 tables still allow public INSERT
SOC 2 Encryption               ✅ TLS + at-rest
SOC 2 External Audit           ❌ Not done (vendor task)
SOC 2 Pen Testing              ❌ Not done (vendor task)
```

**Pilot-ready?** Almost. 5 more policy fixes needed — all identical pattern (drop `{public}` INSERT, replace with `{service_role}`).

## Implementation Plan (All RLS-only, zero app code impact)

### Migration 1: Fix consent USING(true) regression
- Drop the `"Allow consent verification by token"` policy that uses `USING (true)`
- Replace with service-role-only UPDATE (the consent verification edge function already uses service role)
- Keep the existing service_role UPDATE policy

### Migration 2: Fix system table INSERT policies (batch)
Drop `{public}` INSERT policies and replace with `{service_role}` on:
- `student_behavior_stats` ("System can insert stats")
- `risk_alert_notifications` ("System can insert notifications")
- `student_risk_history` ("System can insert risk history")
- `practice_exercises` ("System can create exercises")

### Migration 3: Fix game table INSERT policies
- `game_rounds` — restrict INSERT to service_role or classroom teacher
- `game_players` — restrict INSERT/UPDATE to service_role or `auth.uid() = profile_id`

### Migration 4: Re-run security scan to confirm 0 errors

**Estimated time:** 1 hour. **Risk to existing features:** Zero — all inserts to these tables come from triggers, SECURITY DEFINER functions, or edge functions using service_role.

