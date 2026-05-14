# Pre-K Worlds Are Broken — Real Root Cause + Fix

## What's actually broken

Phase 1 added data (`mode: 'prek'`, `storyIndex: -1`, new enemies `wiggleworm/bouncer/echo_blob`, Pre-K word banks) but **nothing reads any of it**. The runtime that converts `world.levels` → playable cards lives in `src/pages/student/AuraPractice.tsx` (lines 419–540) and it has zero awareness of Pre-K. So:

**Bug 1 — Fake titles on level cards** (`AuraPractice.tsx:443`)
```ts
const story = isTutorial
  ? { ...tutorial story... }
  : (activeStories[levelData.storyIndex] || activeStories[idx % activeStories.length]);
```
For Pre-K, `storyIndex = -1` → `activeStories[-1]` is undefined → falls back to `activeStories[idx % length]`. Result: every Pre-K world gets the same first 5 curated stories: "The Friendly Dog", "My Pet Fish", "The Big Red Ball", "The Little Star", "The Magic Garden". That's why all 3 worlds look identical in your screenshots.

**Bug 2 — Wrong enemy → goblin sprite** (`AuraPractice.tsx:472–506`)
The `enemyMap` lookup has no entry for `wiggleworm | bouncer | echo_blob`, so `setRpgEnemyType(enemyMap[primaryEnemy] || 'minion')` always falls back to `'minion'` (goblin). The pretty new sprites Phase 1 added are never actually rendered in the level grid OR the battle.

**Bug 3 — Battle still routes to standard story arena**
`handleLevelSelect` always calls `setRpgView('battle')` and `setRpgStory(curated story)`. There is no `mode === 'prek'` branch anywhere, so even if titles were right the user lands in the full RPGBattleArena with story passages, comprehension prompts, and minigames — exactly what Pre-K is supposed to skip.

**Bug 4 — Cosmetic: same forest background**
The arena background is keyed off the world id but the Pre-K worlds aren't in the background map either, so they inherit the default forest scene.

The earlier "Phase 1 verified ✅" claim was structurally true (data exists, types compile) but operationally false: nothing consumes it. I owe you a straight call on that — it was over-confident.

## Fix plan (single phase, ships Pre-K end-to-end)

### Step 1 — Branch level building on `world.mode === 'prek'`
`src/pages/student/AuraPractice.tsx` (lines 427–462). When the world is Pre-K:
- Build `levels` from `getPreKContent(worldId, levelId)` in `src/data/preKWordBanks.ts` instead of curated stories.
- Synthesize a lightweight `story` shape per level so `RPGLevelSelect` keeps rendering: title from the word list (e.g. "Lesson 1 · jump · hop · run"), grade_level 0, no passage_text, `category: 'adventure'`, cover_gradient from the world.
- Unlock rule: linear (level N unlocks when N-1 completed). First always unlocked.

### Step 2 — Map new enemies properly
Same file, `enemyMap` (lines 472–506): add `wiggleworm`, `bouncer`, `echo_blob`. Also extend `EnemyType` union in `src/lib/battleMechanics.ts` if missing, and make sure `BattleArena` / `RPGCharacterSprite` already handle them (Phase 1 added the renderers — verify wiring).

### Step 3 — Route Pre-K to a dedicated reader, not RPGBattleArena
In `handleLevelSelect`, if `selectedWorld.mode === 'prek'`, set a new view (`rpgView = 'prek_reader'`) instead of `'battle'`. Render a new component:

`src/components/aura/game/rpg/RPGOneWordReader.tsx`
- Props: `world`, `level`, words/phrases from `getPreKContent`, `onComplete`, `onBack`.
- Layout: friendly enemy sprite (Wiggleworm/Bouncer/EchoBlob) on one side, knight+princess on the other, ONE giant word in the center, Hear / Start Reading buttons. No story panel, no comprehension, no minigames.
- On correct read → fire `triggerVerb` so `VerbAnimationLayer` plays the matching animation (already wired in Phase 1's `verbAnimations.ts`), advance to next word.
- After last word → simple celebration → call `onComplete` with stars based on accuracy.

### Step 4 — Pre-K-friendly battle/world visuals
- Add background gradients/scene for worlds 101/102/103 in whichever map keys the arena background by world id (likely `RPGBattleArena.tsx` constants — confirm during implementation). Use the pastel gradients already defined on each Pre-K world.
- Keep enemies non-attacking (HP only, no fail state — already true in `rpgBattleData.ts`).

### Step 5 — Persistence
Reuse the existing `campaign_progress.world_progress[worldId]` array. For Pre-K, store the synthesized level title (e.g. `"prek-101-1"`) so it doesn't collide with curated story titles.

## Files touched

- `src/pages/student/AuraPractice.tsx` — branch level builder + enemy map + Pre-K view route (the actual fix for all 4 bugs)
- `src/components/aura/game/rpg/RPGOneWordReader.tsx` — NEW component
- `src/lib/battleMechanics.ts` — extend EnemyType union if needed
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — add Pre-K background entries (only if it owns the bg map)

## Out of scope for this fix
- School Mode pivot (deferred per your earlier instruction)
- New sprite art beyond what Phase 1 already drew
- Any change to grades 1+ story flow

## Honest call on Phase 1
Phase 1 shipped the *ingredients* (data, sprites, verb maps) but never wired them into the only page that builds playable levels. That's why the screenshots look like all three worlds are clones — they literally are, because they're being built from `curatedStories[0..4]`. This plan is the missing wiring, not a redo.
