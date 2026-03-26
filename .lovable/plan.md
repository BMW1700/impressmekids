

# Brutally Honest Platform Audit — March 26, 2026

## Bottom Line

**The 5 security fixes from the last audit were NEVER IMPLEMENTED.** They were planned and approved, but the migrations were never run. The same vulnerabilities are still live. You have **6 errors** and **11 warnings** on the security scan right now.

**RPG mode and AURA are completely untouched** — no code changes were made to any RPG or AURA files. Those systems are safe.

---

## Current Security Scan Results: 6 ERRORS, 11 WARNINGS

### ERRORS (Must fix before pilots)

| # | Finding | Table | Status |
|---|---------|-------|--------|
| 1 | **Any user can forge parental consent** — UPDATE policy uses `USING (true)` for `{anon, authenticated}` | `student_signup_consents` | STILL OPEN |
| 2 | **Any authenticated user can create districts** — INSERT uses `auth.uid() IS NOT NULL` | `districts` | STILL OPEN |
| 3 | **Anyone can inject fake backup audit logs** — INSERT policy applied to `{public}` not `{service_role}` | `backup_audit_log` | STILL OPEN |
| 4 | **Anyone can inject fake safety audit logs** — INSERT policy applied to `{public}` not `{service_role}` | `safety_audit_log` | STILL OPEN |
| 5 | **Any admin can create schools in ANY district** — tautological condition `p.district_id = p.district_id` (compares column to itself) | `schools` | NEW FINDING |
| 6 | **Parents with denied requests can view student profiles** — `can_parent_view_student_profile` has no `status = 'approved'` check | `profiles` function | STILL OPEN |

### WARNINGS (11 total — mostly acceptable)
All 11 are "RLS Policy Always True" warnings on audit/system tables that use `WITH CHECK (true)` for service-role INSERT. These are acceptable false positives for tables managed by triggers and SECURITY DEFINER functions — EXCEPT for the ones flagged as errors above.

---

## Did the security changes break RPG or AURA?

**No.** Zero changes were made to:
- `RPGBattleArena.tsx` (RPG combat, damage formulas, Q-learning call)
- `useMLIntegration.ts` (ML pipeline, training data saves)
- `crossModalTransferNetwork.ts` (Cross-Modal Transfer)
- `cmuDictWrapper.ts` (phoneme dictionary)
- Any AURA reading/recording components

The proposed fixes are **purely RLS policy changes** — they restrict who can write to admin tables. No student-facing, teacher-facing, or game code is affected.

---

## Compliance Scorecard (Honest)

```text
COPPA Parental Consent Flow    ❌ BROKEN — anyone can forge consent records
COPPA Data Deletion Portal     ✅ Working
COPPA Under-13 Age Gate        ✅ Working
FERPA Student PII Protection   ⚠️  Weakened by district privilege escalation
FERPA Audit Trail Integrity    ❌ BROKEN — anyone can inject fake audit entries
FERPA Role-Based Access        ✅ Working (538+ RLS policies)
SOC 2 Access Controls          ❌ BLOCKED by privilege escalation + audit gaps
SOC 2 Encryption               ✅ TLS + at-rest via infrastructure
SOC 2 External Audit           ❌ Not done (required, can't be code-fixed)
SOC 2 Pen Testing              ❌ Not done (required, can't be code-fixed)
```

**Pilot-ready?** Not until the 6 errors are fixed. A school IT team doing due diligence would find these.

---

## Implementation Plan (All RLS-only, zero impact on app code)

### Migration 1: Fix COPPA consent tampering (CRITICAL)
- Drop `"Allow consent verification"` UPDATE policy on `student_signup_consents`
- Create new policy: `USING (consent_token = current_setting('request.headers')::json->>'x-consent-token')` OR restrict to `{service_role}` only
- Remove `anon` from roles

### Migration 2: Fix district privilege escalation (CRITICAL)
- Drop `"District admins can create districts"` INSERT policy on `districts` (the `is_district_manager` policy already covers legitimate creation)
- Drop `"District admins can insert their own account"` INSERT policy on `district_admins`

### Migration 3: Fix audit log INSERT policies
- Drop `"Service role can insert audit logs"` (the `{public}` one) on `backup_audit_log` — keep the `{service_role}` version
- Drop `"Service role can insert safety audit logs"` (the `{public}` one) on `safety_audit_log`

### Migration 4: Fix schools INSERT tautology
- Drop `"Admins can create schools in their district"` policy
- Recreate with correct condition: `p.district_id = schools.district_id` (not `p.district_id = p.district_id`)

### Migration 5: Fix parent profile view
- Update `can_parent_view_student_profile` function to add `AND par.status = 'approved'`

### Migration 6: Re-run security scan to confirm 0 errors

**Estimated time:** 2-3 hours. **Risk to existing features:** Zero — these are all database permission changes, no app code touched.

