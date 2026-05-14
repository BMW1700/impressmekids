# Plan — Pre-K Worlds + One-Word Reader + New Sprites + Verb Animations Expansion

Strategy: prepend 3 new Pre-K worlds (-3, -2, -1) before Tutorial. Worlds 1–12 stay untouched. Pre-K worlds use a new one-word reader (no story, no comprehension), 3 brand-new "friendly" enemy sprites, and a beefed-up verb-animation library so reading "jump" / "drink" / "shrink" makes the enemy actually do it.

## Architecture decision

The current battle loop assumes a `CuratedStory` → 5-word batches → barrage minigames → comprehension quiz. Forcing Pre-K through that path means hacking 6 components. Instead:

- **Pre-K gets a parallel, slimmed battle path** in the same `RPGBattleArena` gated by a new `world.mode === 'prek'` flag.
- Reuses: enemy sprite system, HP bar, victory screen, gold/XP, mic + speech-recognition manager (with the token guard we just shipped), verb-animation layer.
- Skips: story text, 5-word batching, all 25+ minigames, comprehension quiz, vocab tooltips.

This is ~1 new branch in `RPGBattleArena`'s render switch, not a new arena.

## Phase 1 — Data + sprites

1. **Extend `CampaignWorld`** in `src/lib/campaignData.ts` with optional `mode?: 'story' | 'prek'` (default `'story'`). Negative IDs allowed.
2. **Three new Pre-K worlds** prepended to `campaignWorlds` (kept in declaration order; `RPGWorldMap` already iterates the array):
   - **World -3 "First Words"** — 5 levels, sight words: *I, a, the, is, my, you, me, see, go, up, down, in, on, big, little*. Boss: Wiggleworm.
   - **World -2 "Action Time"** — 5 levels, verb words that map 1:1 to verb animations: *jump, spin, flip, shrink, grow, hop, dance, wiggle, clap, run, eat, drink, sleep, sing, fly*. Boss: Bouncer.
   - **World -1 "Word + Picture"** — 5 levels, two-word phrase pairs ("help me" / "help you", "my dog" / "your dog", "in the box" / "on the box"). Boss: Echo.
3. **Three new enemy types** added to `CampaignEnemyType` union and `rpgBattleData.ts`: `wiggleworm`, `bouncer`, `echo_blob`. Low HP (~80), zero attack damage (Pre-K = no fail state), friendly dialogue ("Yay!" / "Try again!"), bright cheerful colors.
4. **Three new sprites** in `RPGCharacterSprite.tsx` — added cases to the `CharacterType` union (`'wiggleworm' | 'bouncer' | 'echo_blob'`) with simple SVG/emoji-based renders matching existing sprite style. No external assets, $0 cost.
5. **World-map gating**: Pre-K worlds always unlocked when no progress exists; story worlds keep their existing unlock chain. Add small "Pre-K" badge gradient.

## Phase 2 — One-Word Reader component

6. **New `src/components/aura/game/rpg/RPGOneWordReader.tsx`** — single big word centered, mic auto-on, optional emoji hint from `wordEmojiMap`, verb-animation fires on the enemy when correct. Reuses the `speechTargetTokenRef` + arm-window pattern from `RPGWordReader` so the mic stays alive between words with no first-word race.
7. **Word-source helper `src/data/preKWordBanks.ts`** — exports `getPreKWords(worldId, levelId)` returning `string[]` (or `Array<{a:string;b:string}>` for World -1). Replaces the `storyIndex → curatedStories` lookup for Pre-K levels.
8. **`RPGBattleArena` Pre-K branch**: when `world.mode === 'prek'`, render `RPGOneWordReader` instead of `RPGWordReader`, skip barrage/minigame triggers, skip comprehension quiz, advance HP by `enemy.maxHp / wordCount` per correct word, route to existing victory screen on KO.
9. **`RPGLevelSelect` Pre-K mode**: hide story title / word count / grade label, show emoji + "X words" instead. Hide BOSS crown styling for Pre-K bosses (still tagged as boss internally for star thresholds).

## Phase 3 — Verb-animation expansion

`src/lib/verbAnimations.ts` already has 32 verbs. Add the missing high-value ones for Pre-K demos:

10. **New transform verbs**: `clap`, `wave`, `nod`, `kick`, `stomp`, `crouch`, `twirl`.
11. **New emoji-prop verbs**: `paint` 🎨, `cook` 🍳, `wash` 🫧, `brush` 🪥, `build` 🔨, `dig` ⛏️, `plant` 🌱, `hug` 🤗, `kiss` 💋.
12. **New `kind: "sequence"` descriptor** — chains an emoji-prop into a transform (e.g., `drink water` = cup approaches → enemy `shrink`). `VerbAnimationLayer.tsx` and `useVerbAnimation.ts` extended to handle the chain. Single new descriptor type, ~40 lines.
13. **Two-word phrase resolver** in `resolveVerbAnimation`: if input has a space, try `phrase` table first (`drink water`, `eat apple`, `wash hands`, `plant seed`) before falling back to per-word.

## Phase 4 — World map + entry points

14. **`RPGWorldMap.tsx`** — Pre-K worlds render with a softer pastel gradient and a "Ages 3–5" badge so older kids visually skip them. No code restructure; just style branch on `world.mode`.
15. **`ModeSelect.tsx`** — leave the two main cards alone, but inside Game Mode dashboard add a "Pre-K Quick Play" shortcut that drops directly into World -3, Level 1 for fast Patrick demos.

## Phase 5 — Validation

16. Read all 15 Pre-K words across a level — mic stays alive, no first-word race, verb animations fire on action words.
17. Confirm Worlds 1–12 still load identically (no story regression; Pre-K branch is fully isolated by `world.mode` check).
18. iPad viewport: one-word reader scales to `text-[10rem]` on landscape.
19. New sprites render in both battle and level-select enemy preview.

## Out of scope

- School-mode pivot (parked per your call).
- Persisting Pre-K progress to Supabase. Pre-K worlds use the same `useCampaignProgress` hook; negative world IDs slot in cleanly with no schema change.
- Audio narration of words (deferred — `speechSynthesis.speak(word)` could be wired in 5 lines later if Patrick wants it).

## File touch list

**New (~7):** `RPGOneWordReader.tsx`, `preKWordBanks.ts`, three sprite cases (in existing file), three enemy entries (in existing file), one verb-phrase table.

**Edited (~6):** `campaignData.ts`, `rpgBattleData.ts`, `RPGCharacterSprite.tsx`, `RPGBattleArena.tsx` (one branch + one prop), `RPGLevelSelect.tsx` (Pre-K cosmetic branch), `RPGWorldMap.tsx` (Pre-K cosmetic branch), `verbAnimations.ts`, `useVerbAnimation.ts`, `VerbAnimationLayer.tsx`.

**Untouched:** every existing world, story, enemy, minigame, multiplayer flow, school mode, auth, DB schema.

Approve and I'll build Phase 1 → 5 in order, pausing after Phase 2 so you can demo it before I expand verbs.
