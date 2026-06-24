
# Brutally Honest Re-Audit

I went back and verified everything before answering. I was **partially wrong** in my last message. Here's the real picture.

## What I got right
- Storage savings from cutting school tables = **basically zero** (~5 MB out of 4 GB). That part stands.
- The slow queries ARE dominated by school-mode tables (`student_behavior_stats`, `classroom_students`, `assignments`). That part stands.

## What I got wrong
I told you the fix was "gate school-mode queries behind a role check in shared dashboards." That would help a little, but it is **not the root cause**. I jumped to a conclusion without checking indexes and RLS policies first. I just checked both. Here is what I found:

### The actual root cause: RLS policy overhead

`student_behavior_stats WHERE student_id = $1 LIMIT 1` is averaging **166 ms** per call. That is a single-row lookup on an indexed column. It should take **under 1 ms**.

Why is it 166x too slow? The table has **4 separate SELECT policies** that get OR'd together on every read:
1. Students viewing own stats — `student_id = auth.uid()`
2. Parents viewing kids — calls `is_parent_of_student(student_id)`
3. Teachers viewing classroom — calls `is_teacher_of_classroom(classroom_id)`
4. (plus role-check overhead)

Postgres evaluates **all of them per row** unless they're written to short-circuit, and the `is_parent_of_*` / `is_teacher_of_*` functions hit other tables. `auth.uid()` is called per row instead of once per query because the policies don't use the `(SELECT auth.uid())` wrapper pattern.

`classroom_students` has **5 OR'd policies** with the same problem — that's why a one-row indexed lookup averages 13 ms across 15,000 calls.

**The indexes are already there.** I verified. The slowness is purely the policies running RLS function calls in a hot loop on every row evaluation.

## What this means for your strategy

You do not need to cut school mode to get massive concurrency wins. The same data, same tables, same features — just rewritten policies — will give you the **2-3x concurrency improvement** I was promising from a 70-table demolition. With less risk, no broken pages, no feature loss, no marketing-collateral changes.

## The correct course of action

### Phase A — RLS performance pass (the real win, 1 migration, ~30 min, reversible)

For each hot table (`student_behavior_stats`, `classroom_students`, `attendance_records`, `assignment_submissions`, `assignments`):

1. Replace `auth.uid()` with `(SELECT auth.uid())` inside policies — Postgres caches the inner SELECT once per query instead of running it per row. This alone gives 5-10x on hot paths.
2. Consolidate the 4-5 OR'd SELECT policies into **one** policy with a single OR'd expression. Postgres can short-circuit a single expression but not separate policies.
3. Confirm `is_parent_of_student`, `is_teacher_of_classroom`, `has_role` are `STABLE SECURITY DEFINER` with `SET search_path = public` (they probably are; I'll verify in build mode).

Expected impact based on the slow-query data: cumulative DB execution time drops from ~1,500 sec to ~150-300 sec. **Concurrency capacity roughly 3-5x.** No feature changes. No frontend changes.

### Phase B — Surgical query gating (small win, optional)

Only after Phase A. The shared `StudentDashboard` / `ParentDashboard` / `ChildDetail` still query empty school tables for game-only users. Gate those queries with `enabled: profile.role === 'student' && hasClassroom` in React Query. Removes ~30% of redundant calls. Maybe another 1.3x on top of Phase A.

### Phase C — Keep everything else

No table drops. No page deletes. No role removals. No Clever removal. Pilot/contract paperwork (Phase 11 from before) is its own track and doesn't need any of this code work to start.

## Risk and reversibility

- Phase A is a single migration. Every policy change is a `DROP POLICY` + `CREATE POLICY` pair. Trivially reversible.
- Zero risk to data. Zero risk to features. Zero risk to roles.
- I run `EXPLAIN ANALYZE` on the top 3 slow queries before and after to confirm the win.

## What I need from you

Say "do Phase A" and I'll switch to build mode and ship the RLS migration. We measure, then decide if Phase B is worth it.

If you want, I can also re-run the slow-queries report 24h after Phase A to show you the actual numbers. That's the honest way to validate I'm not blowing smoke.
