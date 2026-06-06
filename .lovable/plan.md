## Two things to fix

### 1. Castle Shop — "Upgrade failed: Unlock this hero first" on Archer

**Root cause (audited):** The `purchase_castle_hero_level` database function rejects any upgrade unless there is a row in `castle_unlocked_heroes` for that hero. But the **Archer is a starter hero** — starters are treated as implicitly unlocked on the client (`STARTER_HERO_IDS` in `heroRoster.ts`) and are never written to `castle_unlocked_heroes`. So the RPC can't see that you "own" it, and rejects the upgrade.

The same bug would hit any future starter hero.

**Fix:** Update the `purchase_castle_hero_level` database function so it skips the unlock check when the hero is a starter (`archer`). Everything else stays identical — gold balance check, level cap of 5, atomic deduction, upgrade row upsert.

After the migration, the Archer upgrade button works immediately. No client code changes needed.

### 2. Benny's 2-second idle pause

I'll **halve it** rather than remove it. Here's why:

- **Removing entirely** = the loop becomes a continuous walk-cycle-style motion with no breath, which actually looks more robotic and "uncanny" because real characters pause to breathe/blink. It also means the browser is decoding video frames non-stop instead of holding a freeze frame — slightly *worse* for battery on iPad, not better.
- **Halving** (2s → 1s) keeps the natural beat but removes the awkward "did it freeze?" feeling you're describing. That's the sweet spot.
- **Quality:** The pause doesn't affect render quality either way — it's the same encoded video, just held on a frame. The only real trade-off is the *feel* of the timing, which is what you're describing.

**Fix:** Change Benny's idle pause from 2000ms to 1000ms in `BennyDog.tsx`. One number.

### Technical details

**Migration (CREATE OR REPLACE):**
```sql
-- In purchase_castle_hero_level, replace the unlock check with:
IF p_hero_id NOT IN ('archer') THEN
  SELECT 1 INTO v_current_level
  FROM public.castle_unlocked_heroes
  WHERE user_id = v_user_id AND grade_mode = p_grade_mode AND hero_id = p_hero_id;
  IF v_current_level IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unlock this hero first');
  END IF;
END IF;
-- (then reset v_current_level := NULL before the real level lookup)
```

The starter list stays in sync with the client constant `STARTER_HERO_IDS = ['archer']`. If a starter is added later, we extend the `IN (...)` clause in the same place.

**BennyDog.tsx:** find the `setTimeout(..., 2000)` controlling the idle gap and change to `1000`.

### Order

1. Run the migration to fix the upgrade RPC.
2. Edit `BennyDog.tsx` to halve the pause.
3. You verify: try upgrading Archer (should succeed and deduct 80 gold), and watch Benny's idle (should feel less stalled).

Confirm and I'll execute.