

# Complete the 44-Phoneme Set

## Current State
The heatmap has **40 phonemes**. To reach **44**, we need to add **3 R-controlled vowel entries** and **fix the schwa (ə) mapping bug** so it actually produces data.

## Missing Phonemes (3 to add)
| Symbol | Label | Example |
|--------|-------|---------|
| ɑɹ | /ar/ | car |
| ɔɹ | /or/ | for |
| ɛɹ | /air/ | fair |

## Critical Bug Fix: Schwa (ə)
The schwa entry exists in the heatmap but **never receives data** because `cmuDictWrapper.ts` strips stress markers before mapping, so `AH0` (schwa) becomes `AH` → `ʌ` instead of `ə`. Fix: check stress digit before stripping.

## Changes

### 1. `src/lib/cmuDictWrapper.ts`
- Fix `arpabetToIPAPhonemes` to map `AH0` → `ə` (schwa) while `AH1`/`AH2` → `ʌ`
- Add post-processing to detect vowel+ɹ sequences and emit composite R-controlled phonemes (`ɑɹ`, `ɔɹ`, `ɛɹ`) alongside the individual phonemes

### 2. `src/components/aura/PhonemeHeatmap.tsx`
- Add 3 R-controlled vowel entries to `COMMON_PHONEMES` array (reaching 44 total)

### 3. `src/lib/phonemeDifficulty.ts`
- Add `ɑɹ`, `ɔɹ`, `ɛɹ` to the difficulty map (moderate difficulty ~2.5-3.0)

### 4. `src/lib/phonemeDistance.ts`
- Add `ɑɹ`, `ɔɹ`, `ɛɹ` to the articulatory feature matrix

### 5. Edge functions (`update-q-learning`, `generate-practice-exercises`, `analyze-aura`)
- Add the 3 R-controlled phonemes to their phoneme lists/feature maps

No calculation logic changes — just adding the missing phonemes into existing systems.

