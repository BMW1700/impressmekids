

## Root Cause: Revision Inflation Makes the Student Deaf to Parent Updates

### The Bug — Step by Step

```text
1. Student reads word 1 → commitLocal → local rev = 1
2. Student reads word 2 → commitLocal → local rev = 2
3. Student reads word 3 → commitLocal → local rev = 3
4. Student reads word 4 → commitLocal → local rev = 4
5. Student reads word 5 → commitAndPersist → rev = 5, phase = parent_turn
   Student's local rev is now 5. This is broadcast + written to DB.

6. Parent receives broadcast rev=5. Parent's gsRef.current.rev = 5.
7. Parent picks Wind Slash → commitAndPersist → rev = 6, phase = kid_turn
   Parent broadcasts state with rev=6.

8. Student's broadcast handler receives rev=6:
   - iAmActiveTurnHolder = (isHost=true && incoming.turn='host') = TRUE
   - incoming.rev (6) < currentRev (5)? NO → rev=6 > rev=5 → ACCEPTED ✓
```

Wait — that should work. Let me recheck... The problem is actually that `commitLocal` increments rev independently on each word, and `commitAndPersist` ALSO increments on top of the last `commitLocal`. So:

```text
1. Student reads word 1 → commitLocal → rev = 1
2. Student reads word 2 → commitLocal → rev = 2  
3. Student reads word 3 → commitLocal → rev = 3
4. Student reads word 4 → commitLocal → rev = 4
5. Student reads word 5 → commitAndPersist → rev = max(4, 4) + 1 = 5
   Broadcast rev=5 to parent. DB write rev=5.
   Student local rev = 5.

6. Parent receives rev=5 via broadcast → gsRef.current.rev = 5
7. Parent attacks → commitAndPersist → rev = max(5, 5) + 1 = 6
   Parent broadcasts rev=6.

8. Student broadcast handler:
   - currentRev = 5, incoming rev = 6
   - iAmActiveTurnHolder = true (turn=host, student is host)
   - 6 < 5? NO → ACCEPTED ✓
```

This arithmetic is fine. So the bug must be elsewhere. Let me reconsider.

The **real problem** is that the broadcast handler on line 310 has an asymmetric guard that ONLY blocks stale broadcasts when `iAmActiveTurnHolder`. But the student IS the active turn holder when the parent switches back to `turn: 'host'`. The guard at line 311 checks `incoming.rev < currentRev` — this should pass if the parent's rev is higher.

BUT — here's the actual problem: **the `commitLocal` calls during the student's reading inflate `lastQueuedRevRef` on the student side**. When the parent's broadcast arrives, `acceptSnapshot` (used by the poll path and postgres_changes path) checks `incomingRev < currentRev`. If the student's gsRef was set to rev=5 at turn end, and the parent's incoming is rev=6, that should be fine.

Let me look more carefully at the **broadcast handler's specific behavior**. On line 315, when the broadcast IS accepted, it does:
```typescript
gsRef.current = incoming;
lastQueuedRevRef.current = Math.max(lastQueuedRevRef.current, incoming.rev);
setGs(incoming);
```

This should work. But wait — there's a **race condition with the poll**. The poll runs every 2 seconds. After the student's turn ends at rev=5, the DB may still have rev=5. The parent's DB write (rev=6) is async and may not have landed yet. So the poll reads rev=5 from DB, and `acceptSnapshot` sees `incomingRev (5) < currentRev (5)` — that's `<` not `<=`, so it passes equality. But the state at rev=5 is `phase: parent_turn`. This overwrites the parent's broadcast of `phase: kid_turn` at rev=6.

**THERE IT IS.** The `acceptSnapshot` guard on line 137 uses strict `<`:
```typescript
if (incomingRev < currentRev) { // Only rejects if strictly less
```

So when the poll reads `rev=5` and the student is at `rev=5`, it PASSES the guard (5 is not < 5). It then replaces `gsRef.current` with the DB's stale version of rev=5 (which has `phase: parent_turn`). This overwrites the parent's broadcast of `phase: kid_turn` at rev=6 that arrived milliseconds before.

Then when the NEXT poll runs, it reads the DB which now has rev=6 from the parent's write — and updates correctly. But in the meantime, the student saw `kid_turn` flash to `parent_turn` and back — or worse, the `kid_turn` reader remounts but then immediately unmounts when overwritten by the stale poll.

### The Fix

**Fix 1: Change the revision guard to `<=` (reject equal revs too)**
Both `acceptSnapshot` and the broadcast handler should reject incoming state when `incomingRev <= currentRev`, not just `<`. Equal revs from the poll are stale re-reads of the same DB row and should not overwrite locally-applied state.

**Fix 2: The broadcast handler should NOT use the "active turn holder" special case at all**
The active turn holder check on line 310-313 is redundant with a universal `<=` guard. Remove it. Both sides should use the same simple rule: reject if `incoming.rev <= current.rev`.

**Fix 3: Sound effects and event flash on broadcast receipt**
When the student receives the parent's attack via broadcast, play the attack sound and show the event flash message (damage taken, etc.). Currently these effects only fire from the `postgres_changes` handler (line 405-411), but the broadcast handler (line 303-318) does NOT trigger sounds or event flash when accepting parent state. This means the student sees the phase change but gets no feedback about taking damage.

### Files to Modify
- `src/components/aura/game/rpg/RPGOnlinePvPBattle.tsx`
  - Change `acceptSnapshot` rev guard from `<` to `<=`
  - Remove the `iAmActiveTurnHolder` special case from broadcast handler, use universal `<=` guard
  - Add sound effects and eventFlash to broadcast handler when accepting new state with a `lastEvent`
- `src/components/aura/game/rpg/RPGOnlineCoopBattle.tsx`
  - Same `<=` fix in `acceptSnapshot` and broadcast handler for parity

### What This Achieves
- Student immediately sees parent's attack damage, hears the sound, and gets the next 5 words
- No more flickering from poll overwriting broadcast-delivered state
- Seamless back-and-forth: student reads → parent attacks → student reads → repeat

