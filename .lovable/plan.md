

# Fix 2 Remaining Issues

## Issue A: Safari-Incompatible Regex in RPGContextClue.tsx
**Problem**: The lookbehind `(?<=^|\s|[^a-zA-Z])` with alternation crashes Safari/iOS — a major platform for kids on iPads.
**Fix**: Replace the regex with a simple split-and-rejoin approach:
```ts
// Split sentence into tokens, replace matching token, rejoin
const tokens = clue.sentence.split(/\b/);
const displaySentence = tokens.map(t => 
  t.toLowerCase() === clue.blankWord.toLowerCase() ? '______' : t
).join('');
```
This is cross-browser safe and handles punctuation adjacency naturally since `\b` splits at word boundaries.

**File**: `src/components/aura/game/rpg/RPGContextClue.tsx` (lines 55-59)

---

## Issue B: Word Mastery Only Tracks Current Battle
**Problem**: `collectedPowerWords` resets every battle, so the 1.5x "MASTERED" multiplier requires reading the same word 3x in one fight (unlikely). Cross-session mastery never triggers.
**Fix**: 
1. At battle start, query `student_vocabulary` for this student's previously seen words
2. Cache them in a ref (`knownWordsRef`)
3. In the mastery check, merge the DB cache with the current-battle list before checking counts

**File**: `src/components/aura/game/rpg/RPGBattleArena.tsx`
- Add a `useEffect` that queries `student_vocabulary` on mount and stores results in `knownWordsRef`
- Update mastery logic (lines 1608-1626) to check `knownWordsRef.current` for `times_correct` values from the DB

---

## Scope
- 2 files modified
- No new components
- No UI changes — purely logic fixes

