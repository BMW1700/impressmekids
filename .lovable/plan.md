

# Phoneme-Based Story Grade Level System

## What This Does
Each IPA phoneme gets a fixed difficulty score (1–10) based on child speech development research. Word difficulty is computed from its phonemes. Story grade level is auto-calculated from its words. This replaces the current manually hardcoded grade levels.

## Changes

### 1. New file: `src/lib/phonemeDifficulty.ts`
- **Phoneme difficulty map** — every IPA phoneme scored 1–10:
  - Easy (1–2): `/m/, /p/, /b/, /n/, /t/, /d/, /h/, /w/` + simple vowels
  - Medium (3–5): `/k/, /ɡ/, /f/, /v/, /s/, /z/, /l/, /dʒ/, /tʃ/, /ʃ/`
  - Hard (6–10): `/ɹ/, /θ/, /ð/, /ʒ/, /ŋ/`, diphthongs
- `getWordDifficulty(word)` — uses `getIPAPronunciation()` from cmuDictWrapper, averages phoneme difficulties, applies length multiplier for longer words
- `getStoryGradeLevel(text)` — averages word difficulties across all words, maps to grade 0–8 via thresholds
- `getStoryDifficultyLevel(text)` — returns 1–5 difficulty scale

### 2. Update `src/data/curatedStories.ts`
- Import `getStoryGradeLevel` and `getStoryDifficultyLevel`
- Replace hardcoded `grade_level` and `difficulty_level` with computed values at module load time
- Keep hardcoded values as fallbacks in case CMU dict isn't loaded

### 3. No database changes needed
Pure client-side computation using existing CMU Dictionary infrastructure.

## Technical Notes
- Reuses existing `getIPAPronunciation()` which already handles CMU dict lookups + G2P fallback
- ~35 phoneme entries in the difficulty map
- Grade thresholds tuned so existing stories land near their current grade levels

