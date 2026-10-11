# Replace the browser mic with the on-device speech engine (before the App Store)

## Answer
Yes. Finish the mic first, then do the App Store work. Apple's reviewer will judge the reading mic before anything else. You can enroll in the Apple Developer Program now, since approval takes a few days.

## A correction first
The Speech Lab runs **Whisper-tiny**, not Sherpa. I couldn't find a Sherpa web version that loads reliably. Whisper-tiny works the same way: it runs on the device, costs $0, and only accepts the words on screen. It hasn't been tested with a real child's voice yet, so the first step below is a test.

## Steps
1. **Check it in the Speech Lab (you, about 10 minutes):** read 20 or more words on an iPad and on a computer, if possible with a child. Continue only if the new engine scores clearly higher than the old mic.
2. **One shared mic for the whole game:** a single switch picks the new engine and falls back to the old mic automatically if the new one fails to load (very old devices, no WebGPU or WebAssembly).
3. **Quiet loading in the background:** the engine starts loading when a student opens the game page, before they pick a level. They see a short "Getting your reading ears ready…" screen only on their very first visit.
4. **Listen for each word separately:** the new engine hears short bursts of speech, not a running stream. So it listens until the child stops talking, checks that sound against the words on screen, then moves on. The target speed is under 1 second per word.
5. **Roll out in order:** RPG word reader → Shield → Quick Block → the 10 mini-games → Pre-K word cards. Each step can be turned back to the old mic.
6. **Super admin switch:** turn the new engine on or off for everyone without a new release, and show which engine each session used.
7. **Then the App Store plan** (Sign in with Apple, account deletion inside the app, arm64 fix, hiding pricing links, Xcode steps).

## Honest risks
- Whisper-tiny can be slow on old Chromebooks. If it takes longer than about 1.5 seconds per word there, those devices stay on the old mic.
- The first download is about 40 MB per device. It's saved afterwards, but 30 iPads on school Wi-Fi all loading it the first day will be slow.
- It hears short bursts, not a live stream, so it can't highlight words while the child is still speaking. The final judgement will be much more accurate.

## Technical details
- New `src/lib/speech/onDeviceEngine.ts`: a shared `@huggingface/transformers` ASR pipeline (`onnx-community/whisper-tiny.en`, q8, WebGPU when available otherwise WASM) loaded once and cached.
- Voice-activity detection with `@ricky0123/vad-web` (Silero) to cut out each spoken word and send 16 kHz mono audio to the pipeline.
- Snap the transcript to on-screen words (Levenshtein, reusing the `wordMatchingModes.ts` tiers and the Challenge Meter thresholds).
- `speechRecognitionManager.ts` gains an engine adapter so owners (`reader`, `shield`, `quickblock`, the minigames) keep the same `start/stop/claimExternal` API. Mic hand-off rules stay the same.
- Native iOS app: run on-device Whisper in the WebView too, with `@capacitor-community/speech-recognition` as the fallback.
- `app_settings` flag `speech_engine` (`web` | `ondevice`) read at startup; super-admin toggle.
