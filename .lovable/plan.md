

## Fix: Word Echo Not Registering + VocabShield Choices Not Clickable

### Issue 1: Word Echo — words never register (0 echoed)

**Root cause**: Line 119 in `RPGWordEcho.tsx` has `if (!isFinal) return;` — this discards ALL interim speech results and only processes "final" results. Browser speech recognition delays "final" results by 1-3 seconds after speaking, and in continuous mode, final results are often unreliable or delayed further. The user speaks the word, nothing happens, and the timer runs out.

**Fix in `RPGWordEcho.tsx`**:
- Remove the `if (!isFinal) return;` gate
- Process both interim and final results for instant word matching
- Add a match cooldown (500ms) to prevent a single utterance from double-counting as both echo 1 and echo 2
- Use `lastMatchTimeRef` to enforce the cooldown between echo registrations

### Issue 2: VocabShield — answer choices not clickable

**Root cause**: The dark backdrop overlay at line 82 (`<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />`) has default `pointer-events: auto` and sits as a sibling of the content div. While z-index should handle layering, `backdrop-blur` can create stacking context issues in some browsers, making the overlay intercept clicks before they reach the buttons.

**Fix in `RPGVocabShield.tsx`**:
- Add `pointer-events-none` to the backdrop overlay div (line 82) so clicks pass through to the content
- Add explicit `pointer-events-auto` to the content container (line 87) to ensure buttons are always interactive
- Also apply the `onCompleteRef` hardening pattern to prevent the `handleSelect` callback from going stale (the `onComplete` dependency in `useCallback` at line 72 causes recreation, which could lead to issues if the parent re-renders during selection)

### Files to edit
1. `src/components/aura/game/rpg/RPGWordEcho.tsx` — remove isFinal gate, add match cooldown
2. `src/components/aura/game/rpg/RPGVocabShield.tsx` — fix pointer-events, harden callbacks

