

# Plan: Decodability-Based Grade Level System

## The Problem

The current `phonemeDifficulty.ts` grades text by averaging phoneme "difficulty scores" (1-10 based on age of acquisition). This is fundamentally wrong for literacy grading because:

- A single word with /ʒ/ (grade 4-5 phoneme) in an otherwise all-CVC passage **should** bump the grade up, but averaging dilutes it
- It ignores **phonics patterns** entirely (CVC vs. blends vs. vowel teams vs. silent-e)
- It ignores **word structure** (syllable count, morphological complexity)
- It doesn't enforce the "decodability percentage" requirement (K-1 texts must be 90-100% decodable at that level)

## The Fix

Replace the averaging approach with a decodability analysis engine that mirrors real curriculum phoneme/phonics scope-and-sequence.

### New file: `src/lib/decodabilityGrading.ts`

**Grade-level phoneme sets** — define exactly which IPA phonemes are "introduced" at each grade:

```text
K:  /m/ /s/ /t/ /p/ /k/ /b/ /d/ /n/ + /æ/ (short a only)
1:  + /f/ /ɡ/ /h/ /dʒ/ /l/ /ɹ/ /v/ /w/ /j/ /z/ + /ɛ/ /ɪ/ /ɑ/ /ʌ/ + digraphs /ʃ/ /tʃ/ /θ/ /ð/ /ŋ/
2:  + long vowels /eɪ/ /i/ /aɪ/ /oʊ/ /u/ + vowel teams
3:  + diphthongs /ɔɪ/ /aʊ/ + R-controlled /ɑɹ/ /ɔɹ/ /ɝ/ /ɛɹ/ /ɪɹ/
4-5: + /ʊ/ /ʒ/ + all remaining
6+: All 44 phonemes mastered
```

**Phonics pattern detection** — analyze each word's structure:
- CVC (grade K)
- Consonant blends (grade 1)
- Digraphs (grade 1)
- Silent-e / CVCe (grade 2)
- Vowel teams (grade 2)
- Multisyllabic with affixes (grade 3)
- Greek/Latin roots (grade 4-5)
- Morphological complexity (grade 6+)

**Grading algorithm:**

1. For each word, find the **minimum grade at which it is fully decodable** (all its phonemes are introduced AND its phonics pattern is taught)
2. Track decodability percentage at each grade level
3. The passage grade = the **lowest grade where ≥90% of words are decodable** (for K-1) or ≥80% (for 2-3) or natural language (4+)
4. Hard floor: if ANY word requires grade N phonemes, passage grade ≥ N (weighted by frequency)

**High-frequency word list** — common sight words ("the", "is", "said", "was") are excluded from decodability checks since they're memorized at all levels.

### Modify: `src/lib/phonemeDifficulty.ts`

- Keep `getPhonemeDifficulty()` (still used by ML/RL systems)
- Replace `getStoryGradeLevel()` internals to call the new decodability engine
- Replace `getStoryDifficultyLevel()` to use new grade mapping
- Keep `getWordDifficulty()` for backward compatibility but add `getWordGradeLevel()` as the primary API

### No changes needed to:
- `src/data/curatedStories.ts` — still calls `getStoryGradeLevel()` / `getStoryDifficultyLevel()`, just gets better results
- `src/lib/cmuDictWrapper.ts` — phoneme lookup stays the same
- Any UI components — they consume grade levels, not the internals

## Technical Detail

### Word Analysis Pipeline

```text
word → CMU Dict → IPA phonemes → [phoneme grade check] → min grade for phonemes
                                → [pattern detection]   → min grade for pattern
                                → max(phoneme grade, pattern grade) = word grade
```

### Syllable/Pattern Detection

Use the IPA phoneme sequence to detect:
- **CVC**: consonant + vowel + consonant (3 phonemes)
- **Blends**: two consonants adjacent at onset/coda
- **Digraphs**: /ʃ/, /tʃ/, /θ/, /ð/ (detected directly from phonemes)
- **Silent-e**: check spelling for final-e + long vowel phoneme
- **Vowel teams**: long vowel phonemes with spelling patterns like "ai", "ee", "oa"
- **Multisyllabic**: count vowel phonemes > 2
- **Affixes**: check for common prefix/suffix letter patterns

### Decodability Scoring

```text
For each candidate grade G (0 through 12):
  decodable_count = words where word_grade <= G
  decodability_pct = decodable_count / total_words

Passage grade = lowest G where:
  - G <= 1: decodability_pct >= 0.90
  - G <= 3: decodability_pct >= 0.80
  - G >= 4: decodability_pct >= 0.70
```

### High-Frequency Sight Words

~100 words exempt from decodability checks: "the", "a", "is", "are", "was", "were", "said", "have", "has", "do", "does", "you", "your", "they", "their", "there", "what", "where", "when", "who", "why", "how", "could", "would", "should", etc.

## Files

- **New**: `src/lib/decodabilityGrading.ts` — grade-level phoneme sets, phonics pattern detection, decodability percentage calculation, sight word list
- **Modified**: `src/lib/phonemeDifficulty.ts` — rewire `getStoryGradeLevel()` and `getStoryDifficultyLevel()` to use new engine; add `getWordGradeLevel()` export

