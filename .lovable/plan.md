

# Fix Literacy Features — 6 Issues

## Issue 1: Boss Gate Victory Detection
**Problem**: `handleBossGateComplete` sets `enemyHp = 0` but the victory detection `useEffect` likely gates on phase being `reading`/`combat`. Since phase is `boss_gate`, victory never triggers.
**Fix**: In `handleBossGateComplete`, after setting HP to 0, explicitly call `setPhaseSafe('victory', 'boss gate kill')` instead of relying on the HP watcher.

## Issue 2: Context Clue Regex Mismatch
**Problem**: `blankWord` is stripped of punctuation during generation, but the sentence retains punctuation. The `\b` regex boundary fails to match words adjacent to commas/periods.
**Fix**: In `generateContextClue`, extract the word **with** its surrounding context OR in `RPGContextClue`, use a case-insensitive partial match that ignores adjacent punctuation.

## Issue 3: Vocab Shield Uses Hardcoded 10-Word Pool
**Problem**: `generateVocabShield` has its own tiny dictionary instead of using the 130+ `WORD_DEFINITIONS` from VocabularyTracker.
**Fix**: Import `WORD_DEFINITIONS` (or a getter function) and use it as the word source in `generateVocabShield`. Remove the duplicate dictionary.

## Issue 4: Power Words Never Saved to Database
**Problem**: `collectedPowerWords` is local state, lost when battle ends. No save mutation exists.
**Fix**: In the battle end/victory handler, call an upsert mutation to `student_vocabulary` for each collected power word with its definition.

## Issue 5: Word Mastery Bonus Never Implemented
**Problem**: `wordMasteryBonus` state exists but is never populated. No damage multiplier logic.
**Fix**: In `handleWordResult`, after a correct word, query local cache of `student_vocabulary` to check if word was seen before. If `times_correct >= 3`, apply 1.5x damage multiplier and show "WORD MASTERED!" floating text. If seen before, apply 1.2x.

## Issue 6: Comprehension Quiz Distractors Are Absurd
**Problem**: Distractors like "A recipe for making cookies" and "All the characters are robots" are obviously wrong — they don't test comprehension.
**Fix**: Generate plausible distractors from the story itself — use other sentences/events from the passage, rephrase actual content incorrectly, or use themes from other stories in the curated set. Keep at least one distractor that sounds reasonable.

## Files Modified
- `RPGBattleArena.tsx` — fixes #1, #3, #4, #5
- `RPGContextClue.tsx` — fix #2
- `ComprehensionQuiz.tsx` — fix #6
- `VocabularyTracker.tsx` — export `WORD_DEFINITIONS` for use in #3

