
## Brutal-honest recap (so nothing is oversold)

- **Web Speech API and iOS `SFSpeechRecognizer` do NOT expose a strictness dial.** They only return transcripts (+ optional confidence). Apple and Chrome give you no acoustic threshold knob.
- **All 1-5 strictness on YubiLearn is our own post-processing** (`wordMatchingModes.ts`, `phonemeInference.ts`, homophones, phonics-confusion map, Levenshtein).
- **Good news:** because the dial lives above the recognizer, it works identically on Web + iOS Capacitor. Only the transcript source changes; the matcher is shared.

## What we're building

Turn the existing `CHALLENGE_LEVELS` table (already in `src/lib/challengeMeter.ts`) into the single source of truth every matcher reads at runtime, live-tunable per student, with teacher override + parent control already wired to `challenge_settings`.

### 1. Runtime thresholds — replace hardcoded constants

Refactor `src/lib/wordMatchingModes.ts` so `isWordMatchLenient`, `isWordMatchStrict`, `isWordMatchBattle`, `matchWithPhonemes`, and `analyzeWordMatch` accept an optional `ChallengeThresholds` argument. When omitted, fall back to the current defaults (level 3) so nothing regresses.

Level dial maps to actual matcher behavior:

```text
Level 1 Very Easy  → Levenshtein ≤ 55% of word len, phoneme sim ≤ 0.55,
                     accept homophones + phonics-confusion + child variants
Level 2 Easy       → Lev ≤ 45%,  phoneme sim ≤ 0.45,  accept child variants
Level 3 Standard   → current lenient behavior (unchanged default)
Level 4 Strict     → current strict behavior, no child variants
Level 5 Very Strict→ exact + true-homophones only, no confusion map,
                     Lev ≤ 15%, phoneme sim ≤ 0.10
```

Also patch the hardcoded `arePhonemesSimilar(..., 0.2)` in `phonemeInference.ts:91` and `0.3` in `wordMatchingModes.ts:165` to read `thresholds.phonemeSimilarityThreshold`.

### 2. Live per-student thresholds (already-in-DB, now consumed)

- `useChallengeSettings(studentId)` already returns `{ level, thresholds }` and already listens to Supabase. Add a **realtime subscription** on `challenge_settings` filtered by `student_id` so a parent sliding on their phone or a teacher overriding from the dashboard changes the live student session within ~1 second — no refresh, no re-login.
- Add a lightweight React context `ChallengeContext` mounted inside the student session shell so every reader (`WordByWordReader`, `SingleWordReader`, RPG readers, TugOfWar, `PhonicsMasteryCheck`, `PredictivePractice`) pulls thresholds from one place instead of prop-drilling.
- Every call site above swaps `isWordMatchLenient(a,b)` → `isWordMatchLenient(a,b, thresholds)`.

### 3. Teacher override UI

New `src/components/teacher/StudentChallengeOverride.tsx` — a slider on the student detail page. Writes with `overridden_by_teacher: true` so the parent UI surfaces the amber banner that already exists in `ChallengeSettings.tsx`.

### 4. iOS / Capacitor parity

`@capacitor-community/speech-recognition` returns the same shape as Web Speech (matches array of strings). Add `src/lib/speechRecognizer/index.ts` — a thin adapter that picks the native plugin on Capacitor and `window.SpeechRecognition` on web, exposes one `startRecognition({ onResult })` API. Existing readers already treat transcripts as strings, so the Challenge Meter operates on the output of *both* recognizers identically. No matcher changes needed for iOS beyond routing through the adapter.

### 5. Default seeding

Backfill trigger on `challenge_settings`: when a student is created, insert `{ level: 3, set_by_role: 'system' }` so every account has a row (avoids the `useChallengeSettings` fallback path and makes realtime edits reflect instantly).

### 6. QA harness (proves the dial works)

- Add `src/lib/__tests__/challengeMeterMatching.test.ts` running the matcher against a fixed transcript set at each level 1-5; assert monotonicity (level N ⊆ level N-1 accepted set). This is our brutal-honesty proof the dial actually changes behavior.
- Manual smoke: same student, same audio, slide 1→5 in parent portal, watch acceptance change live in a reader.

## Files touched

- **Edit**: `src/lib/wordMatchingModes.ts`, `src/lib/phonemeInference.ts`, `src/hooks/useChallengeSettings.ts` (add realtime), all reader components (~9 files) to thread thresholds.
- **New**: `src/contexts/ChallengeContext.tsx`, `src/lib/speechRecognizer/index.ts`, `src/components/teacher/StudentChallengeOverride.tsx`, `src/lib/__tests__/challengeMeterMatching.test.ts`.
- **DB migration**: default-seed trigger on `challenge_settings`.

## Explicitly NOT changing

- No change to Web Speech / native recognizer configuration — confirmed above that they have no strictness knob to change.
- No regression to existing K-12 speech flows: default is level 3, matching today's behavior byte-for-byte when no row exists.

Approve and I'll ship it.
