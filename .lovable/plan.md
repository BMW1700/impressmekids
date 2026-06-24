# Phase B — RLS pass on the next tier of hot tables

## Goal
Apply the same proven pattern (consolidate overlapping SELECT policies, wrap `auth.uid()` in `(SELECT auth.uid())`) to the next tier of frequently-read tables. Then stop, measure, and decide what's next based on real numbers.

## Scope — tables touched
One migration, policy changes only. No schema changes, no data changes, no frontend changes.

- `reading_sessions` — 8 policies, hit on every game session save
- `aura_records` — 13 policies (worst offender by policy count)
- `aura_access_log` — 2 policies, written on every AURA view
- `campaign_battle_sessions` — 7 policies, hit during LexiQuest battles
- `parent_student_links` — 9 policies, referenced by many other policies as a subquery
- `student_reading_stats` — 4 policies, hit on dashboard loads
- `parent_accounts` — 6 policies, hit on every parent request
- `classrooms` — 6 policies, hit on every classroom page

## What the migration does for each table
1. `DROP` the existing overlapping SELECT policies.
2. `CREATE` one consolidated SELECT policy with all access conditions OR'd into a single expression so Postgres can short-circuit.
3. Replace bare `auth.uid()` with `(SELECT auth.uid())` so the value is cached once per query, not re-evaluated per row.
4. Keep INSERT/UPDATE/DELETE policies intact unless they have the same multi-policy pattern, in which case consolidate them too.
5. Preserve every existing access rule — students, parents, teachers, admins keep exactly the same permissions they have today.

Where helpful, reuse the existing `SECURITY DEFINER` helpers (`is_teacher_of_classroom`, `is_parent_of_student`, `has_role`) so subqueries become single indexed function calls instead of inline joins.

## Expected outcome
- Cumulative DB execution time on these tables drops 3-5×.
- Stacked on top of the last migration: estimated concurrent capacity goes from ~3K → ~6-10K active users.
- Zero feature changes, zero risk to data, fully reversible (each `DROP POLICY` + `CREATE POLICY` pair can be inverted).

## After the migration ships
1. Wait 24 hours for live traffic to populate fresh `pg_stat_statements`.
2. Re-pull the slow-query report and `db_health` snapshot.
3. Compare before/after numbers on the actual top offenders.
4. Decide whether to proceed to Phase C (`user_roles` indexing) or Phase D (rollback hunt) based on which is now the biggest remaining bottleneck.

## What is NOT in this plan
- No table drops, no role removals, no Clever changes.
- No frontend edits.
- No Cloud compute upgrade (that's a UI toggle, separate decision).
- No partitioning, read replicas, or sharding — those come after we exhaust the cheap wins.

## Technical detail (for reference)
The pattern, illustrated on one table:

```sql
-- Before: 4 separate policies, each evaluated per row
CREATE POLICY "students view own"     ON reading_sessions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "parents view kids"     ON reading_sessions FOR SELECT USING (is_parent_of_student(student_id));
CREATE POLICY "teachers view class"   ON reading_sessions FOR SELECT USING (is_teacher_of_classroom(classroom_id));
CREATE POLICY "admins view all"       ON reading_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- After: 1 policy with cached auth.uid(), short-circuit OR
CREATE POLICY "reading_sessions_select" ON reading_sessions FOR SELECT
USING (
  student_id = (SELECT auth.uid())
  OR is_teacher_of_classroom(classroom_id)
  OR is_parent_of_student(student_id)
  OR has_role((SELECT auth.uid()), 'admin')
);
```

Same access semantics. One expression Postgres can short-circuit. `auth.uid()` evaluated once per query instead of once per row.
