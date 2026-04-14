

## Root Cause: First `pushState` Stalls for Minutes

### The Evidence
- Room `4X6S6E`: 48 minutes for 6 state updates
- Room `HCU38E`: 11 minutes for 12 state updates
- User confirms: first round is 5+ minutes, subsequent rounds are fast

### Why It Happens
Every single word the student reads triggers `commitState` → `enqueueStatePersist` → `pushState`. The write queue is **serial** — each write awaits the previous one. The `pushState` function calls `await supabase.auth.getSession()` then `await supabase.from(...).update(...)`.

On the **first call**, the Supabase HTTP connection is cold. If the initial fetch request stalls at the TCP level (common on first request to a new endpoint), the browser's default fetch timeout is **5 minutes (300 seconds)**. All 5 queued writes sit behind this stalled first request. Once the connection warms up, subsequent writes fly through instantly — matching exactly what you described.

### The Fix (Two Changes)

**Change 1: Only write to DB on turn switches, not every word**
Right now, reading 5 words produces 5 DB writes. The parent doesn't need real-time word-by-word DB persistence — they need to know when it's their turn. Intermediate word progress will be sent via lightweight broadcast messages instead (no DB round-trip). This reduces 5 sequential DB calls to **1** per turn.

**Change 2: Add a 5-second timeout + broadcast-first pattern**
- Fire the broadcast signal **before** starting the DB write, not after
- Add `AbortSignal.timeout(5000)` to prevent any single write from hanging for 5 minutes
- If the write times out, retry once then move on (local state is already correct)

### What This Looks Like in Practice

```text
Student reads word 1 → local state updates, broadcast "progress" signal (no DB write)
Student reads word 2 → local state updates, broadcast "progress" signal (no DB write)
...
Student reads word 5 → local state updates, turn switches → broadcast signal → DB write with 5s timeout
Parent receives broadcast → rehydrates from DB → sees it's their turn (~100ms)
```

### Files to Modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — Split `commitState` into `commitLocal` (broadcast-only for word progress) and `commitAndPersist` (broadcast + DB write for turn switches/phase changes). Add timeout to `pushState`. Fire broadcast before DB write.
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — Same pattern for co-op parity.

### Result
First turn transition goes from **5+ minutes** to under **1 second**. DB writes are reduced by 80%. The parent sees turn switches instantly via broadcast.

