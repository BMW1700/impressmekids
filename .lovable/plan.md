# Fix unfair "wrong word" marks in RPG reading (before the App Store)

## How it will work for the child
Nothing changes in what they see. They read the wizard's sentence, and the words light up live, just like today.

What changes: when the old mic misses a word the child really said, a second, more accurate listener on the device catches it about a second later and lights it up anyway. No more red X for a word they read correctly.

```text
Child reads sentence
   |
   +--> Old mic (live)        -> lights words instantly (same as today)
   |
   +--> New on-device engine  -> re-checks the same audio against ONLY
                                 the words in that sentence, then lights
                                 any correct word the old mic missed
```

- If the new engine is slow or can't load on a device, the game works exactly like today.
- No audio ever leaves the device. Costs $0.

## Steps
1. **You test it first (about 10 minutes):** in the Speech Lab, read sentences on an iPad and a computer, with a child if you can. We only continue if the new engine clearly beats the old mic.
2. **Add the backup check to the RPG sentence reader:** the old mic keeps lighting words live, and the new engine rescues missed words in the current sentence. It can only approve words, never take a correct one away.
3. **Quiet loading:** the engine loads in the background when a student opens the game. Only on their very first visit do they see a short "Getting your reading ears ready…" screen.
4. **Roll out in order:** sentence reader, then Shield, then Quick Block, then the other mini-games. Each step can be turned off.
5. **Off by default.** It starts on only for super-admin accounts, then one test class, then everyone. A super-admin switch turns it off for everyone instantly, without a new app release.
6. **Then the App Store work** (Sign in with Apple, account deletion inside the app, hiding pricing in the app, and so on).

## Honest risks
- **Biggest unknown: iPad.** Running a second listener at the same time as the browser's mic can make Safari stop one of them. If step 1 shows that on an iPad, iPads stay on today's mic and only get the improvement later, inside the App Store app.
- **Speed:** the rescue check uses the device's processor. On old iPads and cheap Chromebooks it could make battle animations stutter. Devices that are too slow are detected and kept on today's mic.
- The first load is about 40 MB per device, once. 30 iPads on slow school Wi-Fi the first day will feel it.
- Nothing has been tested with real children's voices yet. That's why step 1 comes first.

## Technical details
- `src/lib/speech/onDeviceEngine.ts`: shared `@huggingface/transformers` Whisper-tiny.en (q8; uses WebGPU when available, otherwise WASM), running in a Web Worker and cached.
- Captures 16 kHz mono audio in parallel with the existing recognizer for the active sentence. When a pause is detected (Silero VAD) or the old mic stalls on a word for about 1.5s, the buffered audio is transcribed and the transcript is lined up against the remaining sentence words using the existing `wordMatchingModes.ts` tiers and Challenge Meter thresholds.
- "Approve-only" merge into `RPGWordReader`'s matched-word state. The live highlighting path stays unchanged.
- Fits into `speechRecognitionManager.ts` without changing the owner API (`claimExternal`/`releaseExternal`).
- `app_settings.speech_engine` flag (`web` | `hybrid`) with a super-admin toggle. Sessions log which engine approved each word.
