

# RPG Mode: 5 Critical Fixes Plan

## Overview
After deep-diving into the codebase, I've identified the root causes of all 5 issues. Here's exactly what's broken and how to fix each one.

---

## Fix 1: Accuracy Always Shows 100%

**Root Cause Found:** When mini-games (Fireball Barrage, Goblin Horde, Word Echo, Wind Chase, Ink Splash, Crystal Prison, Lightning Storm, Void Pull, etc.) complete, they add to `correctWords` but **never add to `wordsRead`**. This makes `correctWords > wordsRead`, so the accuracy formula `correctWords / wordsRead` exceeds 100% and gets capped to 100% by `Math.min(100, ...)`.

For example, in `RPGBattleArena.tsx` line 937-941:
```text
handleBarrageComplete:
  setCorrectWords(prev => prev + destroyed);  // Adds to numerator
  // But NEVER adds to wordsRead (denominator)!
```

This happens in **14+ mini-game handlers**.

**Fix:** In every mini-game completion handler, add the same count to `wordsRead` as is added to `correctWords`. This ensures the accuracy denominator stays correct. The affected handlers are:
- `handleBarrageComplete`
- `handleSpellComboComplete`  
- `handleSpeedTypistComplete`
- `handleDodgeWordsComplete`
- `handleRhymeChainComplete`
- `handleGoblinHordeComplete`
- `handleGroundRippleComplete`
- `handleWebTrapComplete`
- All 6 inline handlers (word_echo, wind_chase, ink_splash, crystal_prison, lightning_storm, void_pull)
- `handleFireballDefenseComplete`

---

## Fix 2: Fireball Barrage Mic Not Destroying Fireballs

**Root Cause Found:** In `RPGFireballBarrage.tsx`, the speech recognition `onresult` handler calls `handleFireballDestroy(fireball.id)` from **inside** a `setFireballs(prev => ...)` callback, but then returns `prev` (the unchanged state). The `handleFireballDestroy` queues a separate `setFireballs` update, but React's batching causes the outer call (returning `prev` unchanged) to overwrite the inner one.

**Fix:** Instead of calling `handleFireballDestroy` from inside the state updater, directly modify the `prev` array within the updater and increment the ref counter there. Also add a more visible "Speak to destroy" prompt showing the current target word, and add a mic indicator to make it clear the mic is listening.

Additionally, the `Speak to destroy` prompt at the bottom currently shows the word but it's not clear which fireball to target. The fix will add a clear targeting indicator showing which fireball the player should say next, with a pulsing mic animation.

---

## Fix 3: Replace Rhyme Chain with "Word Cannon" Mini-Game

**What's being replaced:** `RPGRhymeChain` - a game where players must speak words that rhyme with shown words. This is confusing for younger readers and not very engaging.

**New Mini-Game: "Word Cannon"** - A target-shooting themed game where:
- Word targets appear as floating shields/bubbles across the screen
- The mic is always active (continuous listening)
- Speaking a word correctly fires a cannon blast at the matching target, destroying it with a satisfying explosion animation
- A crosshair/targeting reticle animates on the current target
- Timer counts down (15 seconds)
- Each destroyed target deals damage to the enemy
- Missed words (timer runs out on a target) deal damage to the player
- Visual theme: Magical cannon with energy blasts

This fits the RPG combat theme much better and requires the same core skill (reading words aloud) without the confusing rhyming mechanic.

**Files changed:**
- Create new `RPGWordCannon.tsx` component
- Update `RPGBattleArena.tsx` to replace `RPGRhymeChain` import and usage with `RPGWordCannon`
- Keep the `rhyme_chain` phase name for backward compatibility but render the new component

---

## Fix 4: Ink Splash (Squid Ink) Game Stops After First Word

**Root Cause Found:** In `RPGInkSplash.tsx`, the game requires players to manually TAP each word card to select it before the mic starts listening. After successfully speaking a word, `resetListeningState()` is called which stops the recognition. The game then waits for another manual tap. The completion check also uses a stale closure of `inkWords`.

**Fix:** Make the game fully automatic and continuous:
1. Auto-start mic on mount and keep it running continuously (like Fireball Barrage/Goblin Horde pattern)
2. Auto-select the first unprocessed word automatically
3. After successfully reading a word, auto-advance to the next unprocessed word without stopping the mic
4. Only end the game when the timer expires (not when all words are processed manually)
5. Fix the stale closure in the completion check by using refs instead of state
6. Allow players to optionally tap words to change the target, but auto-cycling is the default

---

## Fix 5: Janky UI / Layout Shifting During Word Reading

**Root Cause Found:** Two elements cause layout shifts in the bottom UI panel:

1. **"x3 COMBO!" badge** in `RPGWordAttack.tsx` (line 207-221): Positioned as `absolute -bottom-2 right-0` inside the attack animation. When this appears/disappears, it extends the container's visual bounds.

2. **The overall reading area height changes** when switching between `RPGWordReader` (tall, with word queue + large word + controls) and `RPGWordAttack` (shorter, just the animation). These are rendered as conditional siblings in the center column, causing the bottom panel to resize.

**Fix (two parts):**

**Part A - Move combo indicator to Party Stats panel:**
- Remove the "x3 COMBO!" badge from `RPGWordAttack.tsx`
- Add the combo display inside `RPGPartyStats.tsx` under the streak counter (right side panel), where it logically belongs
- The combo indicator will show when streak >= 3, displaying "x{streak} COMBO!" with the same fire styling
- This keeps it visible without affecting the center reading area layout

**Part B - Fixed height center reading area:**
- Give the center reading column a `min-h-[320px]` (or similar fixed minimum) so it doesn't collapse when switching between reader and attack animation
- Use `overflow-hidden` to prevent any child elements from expanding the container
- Ensure the RPGWordAttack renders inside a fixed-size container that matches the RPGWordReader height
- When transitioning between correct/incorrect feedback and the next word, the container stays the same size

---

## Technical Summary

| File | Changes |
|------|---------|
| `RPGBattleArena.tsx` | Fix 14+ mini-game handlers to add wordsRead alongside correctWords; replace RPGRhymeChain with RPGWordCannon; add min-height to center reading area |
| `RPGFireballBarrage.tsx` | Fix nested setFireballs state update; improve mic UI/visibility |
| `RPGWordCannon.tsx` (new) | New target-shooting mini-game replacing Rhyme Chain |
| `RPGInkSplash.tsx` | Convert to continuous auto-advancing mic with auto-select; fix stale closure |
| `RPGWordAttack.tsx` | Remove bottom combo badge |
| `RPGPartyStats.tsx` | Add combo indicator below streak counter |

