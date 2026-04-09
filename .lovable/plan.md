

## Fix Plan: 8 RPG Minigame Bugs

### Issues Identified

1. **Void Pull — words don't disappear when spoken**: The speech recognition handler calls `handleWordSave()` from inside a `setVoidWords()` callback, which itself calls `setVoidWords()`. Nested setState calls conflict. Also uses raw `SpeechRecognition` instead of `speechManager`.

2. **Ghostly Whispers — words don't disappear, registers wrong words**: Same nested setState pattern as Void Pull. The matching inside `setGhosts()` calls `handleGhostDestroy()` which calls `setGhosts()` again. Also uses raw `SpeechRecognition`.

3. **Classic Mode shows "COUNTER-HACK" instead of "BLOCK"**: In `RPGQuickBlock.tsx`, `isAgentMode()` and `getMinigameTheme()` are called at **module level** (lines 8-9), outside the component. These evaluate once at import time and get cached. If Agent mode was played first, Classic mode inherits the Agent theme.

4. **Crystal Prison timer doesn't count down**: The timer `useEffect` has `onComplete` and `onWordHit` in its dependency array (line 97). These are unstable prop references that change every render, causing the interval to constantly tear down and restart. Needs `onCompleteRef`/`onWordHitRef` pattern.

5. **Word Echo timer doesn't count down**: Same issue — while it uses `completionTriggeredRef`, the timer still depends on `completeGame` which may recreate. Need to verify the timer's effect dependencies are stable.

6. **Comprehension questions are nonsensical**: The character name regex (`/(?<=[.!?\s])\s*[A-Z][a-z]{2,}/g`) catches any capitalized word like "Sometimes", "Good", "Every". The exclusion list is incomplete. Distractors like "Sometimes" appear as answer options for "Who is a character?"

7. **Purple crystal spikes move too fast / look glitchy**: In `RPGBattleBackground.tsx` (lines 507-537), the crystal elements have opacity animation durations of 3-5 seconds but the visual effect combined with the particle system makes them feel jittery. Need to slow the animation and increase duration.

8. **Quick Block length filter**: Line 153 still has `cleanSpoken.length < 2` (was missed in the earlier sweep).

---

### Changes

**File 1: `src/components/aura/game/rpg/RPGVoidPull.tsx`**
- Replace raw `SpeechRecognition` with `speechManager`
- Move matching logic OUT of `setVoidWords` callback — use refs to read current words, match against them, then call `handleWordSave` outside the setter
- Add `completionTriggeredRef` + `onCompleteRef` hardening pattern

**File 2: `src/components/aura/game/rpg/RPGGhostlyWhispers.tsx`**
- Replace raw `SpeechRecognition` with `speechManager`
- Move matching logic out of `setGhosts` — use refs, match externally, then update state
- Add `completionTriggeredRef` + `onCompleteRef` hardening
- Fix the fade timer's dependency on `onComplete`/`onWordHit` (use refs)

**File 3: `src/components/aura/game/rpg/RPGQuickBlock.tsx`**
- Move `isAgentMode()` and `getMinigameTheme()` calls **inside** the component body (use `useMemo`) so they evaluate at render time, not import time
- Fix `cleanSpoken.length < 2` to `< 1`

**File 4: `src/components/aura/game/rpg/RPGCrystalPrison.tsx`**
- Add `onCompleteRef` and `onWordHitRef` patterns
- Remove `onComplete` and `onWordHit` from the timer `useEffect` dependency array
- Use refs in the timer callback and completion check

**File 5: `src/components/aura/game/rpg/RPGWordEcho.tsx`**
- Verify timer dependencies are stable (the `completeGame` callback's dependency chain). If `completeGame` is recreated, the timer effect will restart. Ensure the timer effect only depends on `completeGame` which should be stable via `useCallback([])`.

**File 6: `src/components/aura/game/rpg/ComprehensionQuiz.tsx`**
- Expand the exclusion list in the character name regex filter to include common non-name capitalized words: "Sometimes", "Good", "Every", "Because", "However", "Although", "Never", "Always", "Maybe", "Perhaps", "Today", "Tomorrow", "Yesterday", "Many", "Most", "Some", "Each", "Very", "Really", "Suddenly", "Quickly", "Finally", "Here", "Just", "Still", "Even", "Much", "Little", "Big", "Great", "First", "Last", "Next", "Only", "Also"
- Add minimum character pool validation: if fewer than 2 real character names are found, use generic plausible name distractors (already partially exists) but ensure correctIndex logic doesn't break
- For boss_gate single-question variant, prefer "main_idea" question type over "character" when character extraction is uncertain

**File 7: `src/components/aura/game/rpg/RPGBattleBackground.tsx`**
- Slow down the crystal animation: increase duration from 3-5s to 6-10s
- Reduce opacity range from [0.3, 0.8, 0.3] to [0.4, 0.7, 0.4] for less jarring flicker
- Add `ease: "easeInOut"` (already present) and increase the delay stagger

