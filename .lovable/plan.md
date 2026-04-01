

# Replace IPA Symbols with English Letters Everywhere

## Problem
IPA symbols (ɛ, æ, ɪ, ɹ, θ, ð, ʃ, ʒ, ŋ, etc.) are shown raw to users in multiple components. Users see cryptic unicode characters instead of readable English labels like "sh", "th", "r", "a", etc.

## Solution
Create one centralized `ipaToEnglish()` utility and use it in every component that displays phonemes to users. Internal calculations (difficulty, distance, CMU lookups) keep using IPA — only the **display layer** changes.

## Centralized Mapping (new file: `src/lib/phonemeDisplayUtils.ts`)

| IPA | Display | IPA | Display |
|-----|---------|-----|---------|
| b | b | p | p |
| d | d | t | t |
| ɡ | g | k | k |
| f | f | v | v |
| θ | th | ð | th |
| s | s | z | z |
| ʃ | sh | ʒ | zh |
| h | h | tʃ | ch |
| dʒ | j | m | m |
| n | n | ŋ | ng |
| l | l | ɹ | r |
| w | w | j | y |
| æ | a | ɛ | e |
| ɪ | i | ɑ | o |
| ʌ | u | eɪ | ae |
| i | ee | aɪ | ie |
| oʊ | oe | u | ue |
| ʊ | oo | ɔ | au |
| ə | er | ɝ | ur |
| aʊ | ow | ɔɪ | oi |
| ɑɹ | ar | ɔɹ | or |
| ɛɹ | air | ɪɹ | ear |

## Files to Change

### 1. **NEW: `src/lib/phonemeDisplayUtils.ts`**
- `ipaToEnglish(phoneme: string): string` — single source of truth
- `ipaToEnglishWithSlashes(phoneme: string): string` — returns `/th/` format
- Handles IPA, ARPABET, and pass-through for already-English symbols

### 2. `src/components/aura/game/rpg/FullReadingStatsModal.tsx`
- Remove local `phonemeDisplay`, `arpabetLabels`, `getPhonemeDisplay`, `getPhonemeLabel`
- Import and use `ipaToEnglish` from the new utility

### 3. `src/components/parent/ParentWeeklyReport.tsx`
- Remove local `phonemeDisplay`, `arpabetLabels`, `getPhonemeDisplay`, `getPhonemeLabel`
- Import and use `ipaToEnglish`

### 4. `src/components/aura/PhonemeMasteryPathway.tsx`
- Replace `/{phoneme}/` and `/{prediction.phoneme}/` with `ipaToEnglishWithSlashes()`

### 5. `src/components/aura/PhonemePracticeExercises.tsx`
- Replace `/{exercise.phoneme}/` with `ipaToEnglishWithSlashes()`

### 6. `src/components/aura/MLInsightsDashboard.tsx`
- Replace `/{pred.phoneme}/` with `ipaToEnglishWithSlashes()`

### 7. `src/components/aura/GeneratedExercises.tsx`
- Replace `/{mlRecommendation.phoneme}/` with `ipaToEnglishWithSlashes()`

### 8. `src/components/aura/PhonemeHeatmap.tsx`
- The `label` field in `COMMON_PHONEMES` already uses English — no change needed for the heatmap headers
- Fix the selected-cell detail popup (line 301) to use `ipaToEnglish()` instead of raw `selectedCell.phoneme`

### 9. `src/pages/teacher/StudentProfile.tsx`
- Lines 318, 332, 346 display raw `{phoneme}` from `phoneme_scores` keys — wrap with `ipaToEnglish()`

### 10. `src/lib/phonemeInference.ts`
- Update `getPhonemeDisplayName()` to use the centralized utility for consistency

## What Does NOT Change
- All internal calculations (phonemeDifficulty, phonemeDistance, cmuDictWrapper, Q-learning, edge functions) continue using IPA symbols
- Database storage continues using IPA symbols
- Only the UI display layer is affected

