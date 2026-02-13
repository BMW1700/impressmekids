
# Add Tap-to-Hear on Words in RPG Mode

## What This Does
Clicking/tapping any word -- either the small word pills at the top or the big current word in the center -- will speak that word aloud using the existing pronunciation player. This lets students hear upcoming words, not just the current one.

## Scope
Only one file changes: `RPGWordReader.tsx`. No other files or logic are touched.

## Technical Details

### File: `src/components/aura/game/rpg/RPGWordReader.tsx`

**1. Word queue pills (lines 911-923):** Add an `onClick` handler to each word pill that calls `playCorrectPronunciation(clean)` where `clean` is the already-computed cleaned word text. Also add `cursor-pointer` to the className so users see it's clickable.

**2. Large current word display (line 972):** Add an `onClick` handler on the word text `<motion.p>` element that calls `playCorrectPronunciation(cleanWord)` (reusing the same logic as the existing "Hear" button). Add `cursor-pointer` styling.

Both use the existing `playCorrectPronunciation` import -- no new dependencies or functions needed. The speech recognition session continues running unaffected since `playCorrectPronunciation` uses the speech synthesis API (output), which is independent from speech recognition (input).
