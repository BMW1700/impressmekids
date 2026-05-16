## Three fixes, all scoped to Pre-K presentation

### 1. Kill the red "33 HP" damage indicator on Worlds 102 and 103

In `src/components/aura/game/rpg/RPGOneWordReader.tsx` the friendly creature shows a big red HP number + red HP bar + red shake on every correct word. For Pre-K worlds 102 (Action Time) and 103 (Word + Picture), this distracts from the verb animation.

Change:
- Hide the `{HP}` red number and the red HP bar block for worlds 102 and 103 (only World 101 keeps the classic battle UI; or remove for all 3 Pre-K worlds — see Q below if needed; default is suppress on 102 + 103 as requested).
- Skip the `setEnemyHit(true)` red flash and the `setShake(true)` screen shake on those two worlds. The creature still animates (jump / verb scene) so feedback is preserved.
- Keep the existing star counter (e.g. `2/3`) at the top — that's the kid-friendly success signal.

### 2. World 103: present phrases as two real words + an action

Today World 103 stores `"help me"` as a single phrase, and `RPGWordReader` strips the space (`replace(/[^a-zA-Z']/g, '')`) so the chip shows `"helpme"` and the matcher rejects natural speech. The displayed phrase ("help me") doesn't match the target ("helpme").

Change in `RPGOneWordReader.tsx`:
- When `content.kind === "phrase"`, expand each phrase into its individual words and feed those to `RPGWordReader` as the real word list. So `"help me"` becomes `["help", "me"]`, `"in the box"` becomes `["in", "the", "box"]`, etc.
- Track which words belong to which phrase so:
  - The big word card still shows the full phrase ("help me") while the kid is reading it.
  - The verb animation (jump, drink, wash, plant, throw…) fires once when the phrase's action word is read correctly (or at phrase completion), not on the filler words.
  - The `2/3` star counter advances per completed phrase, not per word, matching the existing UX.
- Update `damagePerWord` / completion logic to count phrases, not words, so progress dots and stars still line up with the level design.

No change to `preKWordBanks.ts` data — phrases stay authored as-is.

### 3. Add Pre-K rung to My Reading Journey

In `src/lib/readingJourneyLevel.ts`, add Pre-K as the first step of the K-5 ladder:

```text
Pre-K (0 wpm) → K (20 wpm) → 1st (53) → 2nd (82) → 3rd (104) → 4th (123) → 5th (139)
```

That makes `ReadingProgressPanel` render 7 dots and label Pre-K readers correctly. The 6-12 ladder is untouched. `benchmarkGrade` for Pre-K is `-1` (or `0` with a `label: 'Pre-K'`) — used only for display, no downstream benchmark math breaks since existing callers key off `label` / `displayLabel`.

No DB, RLS, or edge-function changes. All edits are presentation-layer.

### Files touched

- `src/components/aura/game/rpg/RPGOneWordReader.tsx` — suppress HP UI + shake on worlds 102/103; expand phrases into individual words while keeping phrase display and per-phrase progress.
- `src/lib/readingJourneyLevel.ts` — prepend Pre-K rung to K-5 ladder.

### One quick check before I build

You said "the same should not be happening on world three" for the red indicator — I'm assuming World 101 (First Words) keeps the HP bar as-is. If you also want it gone there, say so and I'll strip it for all three Pre-K worlds.
