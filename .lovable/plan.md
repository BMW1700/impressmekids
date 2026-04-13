

## Problem Analysis

The host (student) reads words and `commitState` fires on every word, which calls `pushState` → `sync_multiplayer_room_state` RPC. The RPC returns the updated row, and `acceptSnapshot` applies it. However, the **guest (parent) never sees these updates** because:

1. **The RPC call itself may be silently failing.** The `pushState` function casts `supabase` to a manual RPC client type (`rpcClient`), bypassing TypeScript's generated types. If the cast is wrong or the RPC response shape doesn't match expectations, the data may not persist or the response may not be processed correctly.

2. **Revision guard blocks legitimate updates on the guest side.** The `acceptSnapshot` function rejects any snapshot where `incomingRev < currentRev`. But the guest's `gsRef.current.rev` may already be ahead if the guest previously processed a stale or duplicate event, causing all subsequent real updates to be silently dropped.

3. **Realtime subscription may not fire for RPC-based updates.** The `sync_multiplayer_room_state` function is `SECURITY DEFINER` — it updates the row directly. However, Supabase Realtime only fires for changes visible through the **subscribing user's RLS policies**. Since the RPC bypasses RLS, the realtime event may not propagate to the guest's channel. The 2-second poll is the only fallback, but it uses the same `acceptSnapshot` with the same revision guard issue.

4. **The RPC call uses a manual cast instead of the typed client.** The types file shows `sync_multiplayer_room_state` is properly typed, so the cast to `rpcClient` is unnecessary and may cause issues with how the response is parsed.

## Fix Plan

### 1. Fix RPC invocation to use typed Supabase client (RPGOnlinePvPBattle.tsx)
Remove the manual `rpcClient` cast. Use `supabase.rpc('sync_multiplayer_room_state', {...})` directly since the function exists in the generated types. This ensures proper request serialization and response parsing.

### 2. Fix revision guard to allow equal revisions (RPGOnlinePvPBattle.tsx)
Change `if (incomingRev < currentRev)` to `if (incomingRev < currentRev)` but also ensure the guest doesn't artificially inflate its own rev. The guest should never increment `lastQueuedRevRef` — only the writing side should. Add a guard so only the active writer (whoever called `commitState`) tracks `lastQueuedRevRef`.

### 3. Make the poll reconciliation ignore revision on the non-writing side (RPGOnlinePvPBattle.tsx)
The guest (parent) is a passive consumer during the kid's turn. The poll should always apply the latest DB state when the user is not the active turn holder, bypassing the revision guard for read-only reconciliation.

### 4. Add a dedicated realtime channel approach that works with SECURITY DEFINER (RPGOnlinePvPBattle.tsx)
Since `SECURITY DEFINER` updates may not trigger realtime for the other participant, add a Supabase Realtime **broadcast channel** as a lightweight signal. After each `pushState`, broadcast a small message (`{ rev: N }`) on a shared channel. The other client listens for this broadcast and immediately calls `rehydrateRoom()` to fetch the latest state. This gives near-instant updates without relying on postgres_changes.

### 5. Apply the same pattern to RPGOnlineCoopBattle.tsx
- Replace direct `.update()` with the `sync_multiplayer_room_state` RPC
- Add broadcast signaling for instant cross-device sync
- Add a continuous reconciliation poll
- Add revision tracking to co-op game state

### Files to modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx` — Fix RPC call, add broadcast channel, fix revision guard for passive side
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx` — Port the same sync infrastructure
- `src/components/aura/game/rpg/multiplayerRoomTypes.ts` — Add `rev` field to co-op state interface

### Technical detail: Broadcast channel approach
```text
Host reads word → commitState → pushState (RPC) → broadcast { rev: N }
                                                        ↓
Guest receives broadcast → rehydrateRoom() → acceptSnapshot (no rev guard for passive side)
                                                        ↓
                                            UI updates: HP, batch progress, word highlights
```
This is ~50-100ms latency (broadcast + single DB read), which is effectively real-time for a reading game. The existing postgres_changes subscription and 2-second poll remain as fallbacks.

