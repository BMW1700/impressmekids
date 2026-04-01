

# Expand AURA + RPG Mode into Full Literacy Platform

## Overview
Add vocabulary mastery and reading comprehension features that are **fully integrated into RPG combat immersion** — no modal pop-ups that break the flow, no "quiz time" interruptions. Everything happens naturally within the battle mechanics kids already love.

---

## Feature 1: Vocabulary Power Words (In-Battle)

**How it works**: When a student reads a "power word" (6+ letters, not a common word), the RPG battle briefly shows the word's meaning as a glowing tooltip — like a loot drop. The word gets collected into their Word Collection automatically.

### Technical Changes
- **New component**: `RPGWordPowerUp.tsx` — animated overlay that appears after reading a power word, showing the word + short definition in RPG-styled tooltip (e.g., "⚡ POWER WORD: *enormous* — very large, huge!"). Auto-dismisses after 2 seconds. Styled like existing floating damage numbers.
- **`RPGWordReader.tsx`**: After a correct word, check `isPowerWord()` from VocabularyTracker. If true, emit a new `onPowerWord` callback.
- **`RPGBattleArena.tsx`**: Handle `onPowerWord` — show the `RPGWordPowerUp` overlay and grant +2 bonus gold. Track collected words in state, save to `student_vocabulary` table at battle end via existing `VocabularyTracker` mutation.
- **Expand `WORD_DEFINITIONS`** in `VocabularyTracker.tsx` — add ~100 more grade-appropriate definitions. For unknown words, show "New word collected!" without a definition.

---

## Feature 2: Vocabulary Boss Shield (New Mini-Game)

**How it works**: Boss enemies occasionally activate a "Word Shield" where the boss shows a word and 3 definitions — the student picks the right meaning to break the shield and deal massive damage. Wrong answer = the shield holds and the boss counter-attacks. Feels like a boss mechanic, not a quiz.

### Technical Changes
- **New component**: `RPGVocabShield.tsx` — full-screen RPG-styled overlay. Shows the boss behind a glowing shield with a word on it. Three definition options appear as "attack targets." Correct pick = shield shatters (particle effect) + 3x damage. Wrong pick = boss retaliates. 15-second timer adds urgency.
- **`RPGBattleArena.tsx`**: Add `'vocab_shield'` to `BattlePhase` union. Trigger it at HP thresholds (same system as other mini-games) — only for boss/elite enemies. Wire up completion handler for damage/retaliation.
- **Word source**: Pull from words the student has read in the current battle + their `student_vocabulary` collection. Definitions from `WORD_DEFINITIONS` map + AI-generated fallbacks via edge function.

---

## Feature 3: Context Clue Combat (New Mini-Game)

**How it works**: Mid-battle, the enemy casts a "Word Fog" — a sentence appears with one word blanked out, and 3 word options are shown. Student picks the right word using context clues. Correct = dispels the fog + bonus damage. Wrong = fog damages the player.

### Technical Changes
- **New component**: `RPGContextClue.tsx` — shows a sentence from the current story passage with one key word replaced by "___". Three word options (the correct word + 2 distractors) appear as clickable buttons styled like spell choices. Fog/mist visual effect on the battlefield.
- **`RPGBattleArena.tsx`**: Add `'context_clue'` to `BattlePhase`. Trigger randomly at HP thresholds alongside existing mini-games. Sentence source: extract sentences from `story.passage_text` and blank out a content word.
- **Distractor generation**: Simple algorithm — pick words of similar length from the same passage, or from a curated distractor list.

---

## Feature 4: Comprehension Boss Gate (Boss Battles Only)

**How it works**: When a boss drops below 25% HP, it enters "Last Stand" mode. The boss puts up a barrier and the student must answer one comprehension question about the story they've been reading to land the final blow. This uses the existing `ComprehensionQuiz` component (currently unused) but reskinned to feel like a boss mechanic.

### Technical Changes
- **Upgrade `ComprehensionQuiz.tsx`**: Refactor to support a `variant='boss_gate'` prop — single-question mode with RPG theming ("Break through the barrier!"). Remove the modal overlay; render inline in the battle area. Add boss-specific flavor text.
- **Improve question generation**: The current `generateQuestions()` is very basic (asks about story length). Upgrade to extract actual content questions: who is the main character, what happened first/last, what's the problem in the story. Use sentence analysis from the passage text.
- **`RPGBattleArena.tsx`**: Add `'boss_gate'` to `BattlePhase`. When boss HP drops below 25% for the first time, trigger this phase. Correct answer = boss HP set to 0, victory triggered. Wrong answer = boss heals 15% HP, battle continues normally.

---

## Feature 5: Word Mastery Streak Bonuses

**How it works**: If a student correctly reads a word they've seen before in their vocabulary collection, they get a "Mastery Bonus" — extra damage multiplier and the word's `times_correct` increments. After 3 correct readings, the word is marked "mastered" with a special celebration effect.

### Technical Changes
- **`RPGBattleArena.tsx`**: On correct word read, check `student_vocabulary` for existing entries. If found, increment `times_correct`. If `times_correct >= 3`, mark as mastered and show a brief "⭐ WORD MASTERED!" floating text (reuse existing `FloatingDamage` component with gold styling).
- **Damage bonus**: Mastered words deal 1.5x damage. Previously-seen words deal 1.2x damage. New words deal normal damage.
- **`VocabularyTracker.tsx`**: Add a mutation to increment `times_correct` and update `mastered` status.

---

## Database Changes
- No new tables needed — `student_vocabulary` already exists with `times_seen`, `times_correct`, `mastered` columns
- May need to expand `WORD_DEFINITIONS` dictionary or add an edge function for AI-powered definitions

## Files Changed (Estimated)
1. **New**: `RPGWordPowerUp.tsx` — power word loot drop overlay
2. **New**: `RPGVocabShield.tsx` — vocabulary boss shield mini-game
3. **New**: `RPGContextClue.tsx` — context clue combat mini-game
4. **Modified**: `RPGBattleArena.tsx` — wire in all new features, new battle phases
5. **Modified**: `RPGWordReader.tsx` — add power word detection callback
6. **Modified**: `ComprehensionQuiz.tsx` — add boss_gate variant, improve questions
7. **Modified**: `VocabularyTracker.tsx` — expand definitions, add mastery mutations

## Immersion Guarantee
Every feature is a **battle mechanic**, not a quiz overlay:
- Power Words = loot drops
- Vocab Shield = boss attack to counter
- Context Clues = enemy spell to dispel
- Comprehension Gate = boss's last stand barrier
- Word Mastery = damage multiplier system

No feature pulls kids out of the RPG. Everything grants XP, gold, or damage — reinforcing the game loop.

