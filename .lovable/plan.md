# Phase C — `user_roles` indexing + `has_role()` hardening

## Why this matters

The slow-query report showed `user_roles` taking ~4.77M sequential scans since the last DB restart. Every authenticated request on the platform calls `has_role()` somewhere in its RLS chain, which in turn scans `user_roles`. Fixing this affects **every request on the entire app**, not just school-mode pages.

This is the highest-leverage 15-minute change available right now.

## What changes

Single migration, additive only. No table drops, no policy changes, no frontend edits, no feature impact.

### 1. Add a composite index on `user_roles(user_id, role)`

The existing `UNIQUE(user_id, role)` constraint creates a unique index, but the planner's stats may not be using it efficiently for the `has_role(_user_id, _role)` lookup pattern. Add an explicit btree index if one is missing, or confirm the unique constraint's index is sufficient. Also add a standalone index on `user_id` alone, since some policies call `has_role(auth.uid(), ANY)` style patterns that benefit from the narrower index.

### 2. Harden `has_role()` function attributes

Ensure the function is declared:
- `STABLE` (already is — confirm)
- `PARALLEL SAFE` (likely missing — adding this lets Postgres run it in parallel workers)
- `LEAKPROOF` where safe (lets the planner push the filter earlier in query plans)
- `SET search_path = public` (already is — confirm)

### 3. Force a fresh `ANALYZE` on `user_roles`

After the index changes, run `ANALYZE public.user_roles` so the planner picks up the new index immediately rather than waiting for the next autovacuum cycle.

### 4. Same hardening for `is_teacher_of_student`, `is_teacher_of_classroom`, `is_parent_of_student`, `parent_has_aura_consent`

These are the four other SECURITY DEFINER helpers used heavily in the RLS policies we consolidated in Phases A and B. Adding `PARALLEL SAFE` to all of them lets Postgres parallelize the per-row checks in large result sets (teacher loading 30 students' data, parent dashboard with 4 kids, etc).

## Expected impact

- `has_role()` calls: ~1.3-1.5× faster across the board
- Compounds with Phase A + B because every consolidated policy still calls these helpers
- Concurrent user ceiling: ~10-15K → ~13-22K

## What this does NOT touch

- Frontend code: zero changes
- Table structures: zero changes
- RLS access rules: zero changes (same users see the same data)
- Existing data: zero changes
- Other functions, edge functions, or storage buckets: zero changes

## Validation plan after deploy

1. Re-run `slow_queries` immediately to confirm no regression
2. Check `db_health` to confirm connection saturation drops or stays flat
3. Wait 24h with live traffic, re-run `slow_queries`, compare `user_roles` sequential scan count to the previous 4.77M baseline
4. Based on which query is now slowest, decide between Phase D (rollback hunt) or Phase E (PostgREST embed replacement)

## Reversibility

Indexes can be dropped instantly with `DROP INDEX`. Function attribute changes are reversed by re-running `CREATE OR REPLACE FUNCTION` with the old attributes. Zero data risk.
