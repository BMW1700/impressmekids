# Fix PvP Multiplayer Sync — Split Revision Counters

## The Bug
When the parent (guest) takes their turn, the student (host) never sees the update — HP doesn't change, phase stays stuck on `parent_turn`. Host→guest works perfectly.

**Root cause:** A single `rev` counter is used for both (a) authoritative turn/HP changes and (b) word-reading progress ticks. The host's word-reading rapidly increments `rev` (broadcast-only via `commitLocal`), so when the guest's legitimate turn update arrives at e.g. `rev=2`, the host's local `rev` is already at `50` and the stale-revision guard in `applyIncomingState` silently rejects it.

## Implementation

All changes are confined to **`src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`** plus a one-line addition in **`multiplayerRoomTypes.ts`**. No backend/RPC changes — the existing `sync_multiplayer_room_state` RPC keeps working; we just feed it `turnRev` instead of the polluted combined counter.

### 1. Split the counter (types + initial state)
In `multiplayerRoomTypes.ts` add `turnRev: number` and `uiRev: number` to `OnlinePvPGameState` (keep `rev` as a deprecated alias mirroring `turnRev` so any leftover reads don't crash). Initialize both to `0` in `INITIAL_PVP_STATE`.

### 2. Rewire `commitLocal` vs `commitAndPersist`
- `commitLocal` (called on word-reading ticks): increments **`uiRev` only**, broadcasts a `reading_progress` payload. **Never** touches `turnRev`. **Never** calls the sync RPC.
- `commitAndPersist` (called on hero attack, enemy attack, phase change, win): increments **`turnRev` only** (using `Math.max(local.turnRev, highestSeenTurnRev) + 1`), broadcasts the full state, AND calls the sync RPC passing `turnRev` as the revision argument.

### 3. Rewrite `applyIncomingState` conflict logic
Replace the universal `rev` guard with logic keyed on `turnRev`:
- **Echo-suppression** (`sender === selfId`) — kept as-is.
- **Force-apply rule:** if `incoming.phase === 'kid_turn'` (a.k.a. player_turn) and `local.phase === 'parent_turn'` and source is `'db'`/`'poll'`/`'realtime'` → apply unconditionally. Same in reverse for parent_turn transitions arriving on the guest.
- **DB / poll / realtime sources:** if `incoming.turnRev >= local.turnRev` → apply. Do not filter by phase identity.
- **Broadcast source:** light dedupe (skip only if same `turnRev` AND same `sender` as last broadcast). Never reject solely because `turnRev` is lower — broadcasts can arrive out of order.
- Remove the `uiRev`/old-`rev` comparisons entirely from the guard.
- After applying, reset floating-damage and any in-progress animation refs so the new HP renders cleanly.

### 4. Track `highestSeenTurnRev` (replaces `highestSeenRevRef`)
Rename the existing ref to track only `turnRev`. `uiRev` doesn't need collision tracking — it's broadcast-only and ephemeral.

### 5. Watchdog timer
Add a `useEffect` watching `gs.phase`. When `phase === 'parent_turn'` AND `isHost === true`, start a 3-second timer. On fire: call `rehydrateRoom(true)` — which already routes through `applyIncomingState('poll', …)` and will now force-apply the missed transition via the new rule in step 3. Clear/reset the timer on every phase change or on unmount.

### 6. Broadcast payload
Existing broadcast already sends the full `state` object — no shape change needed beyond it now carrying both `turnRev` and `uiRev`. Add a separate lightweight `reading_progress` broadcast type emitted by `commitLocal` (just `{ uiRev, batchProgress, wordsRead, sender }`) so the peer can update its progress UI without going through the full state-merge path.

### 7. Out of scope (do not touch)
- `RPGParentControls.tsx`, `RPGCombatPhase.tsx`
- The `sync_multiplayer_room_state` RPC and DB schema
- Realtime channel subscription setup
- Any other component structure / naming

## Why this fixes it
The guest's turn writes `turnRev=2` to the DB. The host's local `turnRev` is still `0` or `1` (only real turn events bump it — word-reading bumps `uiRev` instead, which the guard ignores). The guard now sees `2 >= 1` → applies. The watchdog covers the residual edge case where both broadcast and realtime are dropped: after 3s stuck in `parent_turn`, the host force-rehydrates from DB and the new force-apply rule pushes the transition through unconditionally.
