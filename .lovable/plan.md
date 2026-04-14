

## Root Cause: Two Bugs Working Together to Create the Flicker

### Bug 1: DB writes silently succeed with zero rows updated
PostgREST's `.update()` returns `{ error: null }` even when **zero rows are matched** due to RLS filtering. The RLS UPDATE policy requires `auth.uid() = host_id OR guest_id`. If the JWT is stale/expired in memory, `auth.uid()` evaluates to NULL server-side, the WHERE clause matches nothing, and PostgREST returns HTTP 200 with no error. The code logs `[PvP] pushState OK` but **nothing was written**. Every room in the database has `rev=0` — confirmed just now.

### Bug 2: The poll overwrites broadcast state on the passive side
The `acceptSnapshot` rev guard (line 132-141) only protects the **active turn holder**. The passive side (parent, when it's kid's turn) **always accepts** incoming state, even if its rev is lower. Here's the deadly sequence:

```text
1. Student reads word 2 → commitLocal fires → broadcast sends rev=5 (batchProgress=2)
2. Parent receives broadcast → applies rev=5 → UI shows word 2 highlighted ✓
3. ~2 seconds later, reconciliation poll fires rehydrateRoom()
4. Poll reads DB → rev=0, batchProgress=0 (DB was never updated!)
5. Parent is passive side → rev guard skipped → accepts rev=0
6. UI snaps back to batchProgress=0 → FLICKER
```

This cycle repeats every 2 seconds. The parent sees the update from broadcast, then it gets yanked back by the poll reading stale DB data. The poll is actively fighting the broadcast.

### Fix Plan

**Fix 1: Universal rev guard in `acceptSnapshot`**
Apply the rev guard to BOTH sides, not just the active turn holder. If the incoming rev is lower than the current local rev, reject it regardless of who holds the turn. This stops the poll from overwriting broadcast-delivered state.

**Fix 2: Verify DB writes actually happened**
Add `.select('id')` to the `.update()` chain. If the returned array is empty, the write was silently blocked. Force a full session refresh and retry. This makes DB write failures visible and recoverable.

**Fix 3: Same fixes to Co-op component**
Apply identical changes to `RPGOnlineCoopBattle.tsx`.

### Files to modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — Fix `acceptSnapshot` rev guard (universal), fix `pushState` to verify writes
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — Same fixes

### What this achieves
- **Flicker eliminated**: Poll can never overwrite a higher-rev state received via broadcast
- **DB writes verified**: Silent RLS failures become visible, trigger session refresh + retry
- **Both directions work**: Parent and student both get instant broadcast updates that persist across poll cycles

