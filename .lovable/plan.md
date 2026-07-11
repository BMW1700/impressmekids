## What we're fixing

**Bug 1 — Retry disappears after tapping Hear.** In Pre-K, when a child gets a word wrong, the feedback overlay opens with three buttons: Hear, Retry, Skip. Tapping Hear plays the word via the browser's built-in voice, but the underlying mic session sometimes fires a new "empty/incorrect" result while the overlay is open, which flips `canRetry` to false and hides the Retry button. Tapping Hear should never affect the Retry state.

**Bug 2 — Correction voice sounds terrible.** All pronunciation playback (`playCorrectPronunciation`) currently uses `window.speechSynthesis`. On iPad/Safari especially, that voice is muffled, quiet, and inconsistent. Now that ElevenLabs is connected, we replace it with the Benny voice.

**Enhancement — Real phonics teaching.** When a Pre-K child misses a word, they should hear it taught the way a teacher would: **"dog. D — O — G. d–o–g… dog!"** — same Benny voice, cached so it's free after the first play.

---

## Plan

### 1. Fix the Retry button (frontend only, no schema change)

`src/components/aura/game/rpg/RPGWordReader.tsx`
- Add `isFeedbackOverlayOpenRef`. While true:
  - `stopRecognitionSession()` on overlay open and **do not** auto-restart the mic.
  - Any speech result / `onend` / `onerror` that arrives is ignored (guard at the top of `processResult` and the restart timers).
  - `canRetry` cannot be flipped to false by anything except the Retry button itself.
- `handleTryAgain` remains the only path that sets `canRetry=false` and re-arms the mic.
- Guarantee overlay stays mounted until user taps Retry or Skip/Continue.

`src/components/aura/game/rpg/WordFeedbackOverlay.tsx`
- Reorder buttons to **Retry · Hear · Skip** (Retry first, most visible).
- Make Retry the large primary button (bigger tap target for Pre-K fingers) and keep it enabled even while Hear audio is playing.
- Add a tiny "Teach me" button next to Hear that plays the phonics breakdown (see §3).

### 2. Swap the correction voice to ElevenLabs Benny

New edge function `supabase/functions/prek-word-tts/index.ts`:
- Input: `{ word: string, voiceId?: string, mode: "say" | "teach" }`.
- If a cached MP3 exists in Storage bucket `prek-word-tts` at `<voiceId>/<mode>/<word>.mp3`, return a signed URL immediately (no ElevenLabs call).
- Otherwise call `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128` with `model_id: "eleven_turbo_v2_5"`, upload the bytes to Storage, return signed URL.
- Uses the already-connected `ELEVENLABS_API_KEY`. `verify_jwt = false` so it works for anonymous Pre-K users.

New storage bucket `prek-word-tts` (public read, service-role write).

New client module `src/lib/bennyVoice.ts`:
- `speakBenny(word, { mode })` — fetches URL from edge function, plays via `HTMLAudioElement` at `volume=1.0`.
- In-memory `Map<string,string>` cache so a repeated Hear tap is instant.
- Falls back to existing `playCorrectPronunciation` (Web Speech) only if the edge function fails.
- Voice ID resolution: use the world-level `default_voice_id` on `prek_worlds` we already added for Redub Studio; fall back to a `VITE_BENNY_DEFAULT_VOICE_ID` const we set once the user shares the ID.

Replace call sites (Pre-K only, K-12 RPG stays on Web Speech for now to keep cost predictable):
- `RPGOneWordReader.handleHearIt` → `speakBenny(currentPhrase, { mode: "say" })`.
- `RPGWordReader` overlay `onPlayAudio` → `speakBenny(word, { mode: "say" })`.
- `RPGWordReader` on-miss auto-cue → same.

### 3. Phonics "Teach me" mode

Same edge function, `mode: "teach"`. Server builds the prompt from the word:
- 1-syllable CVC (dog): `"dog... D — O — G... d–o–g... dog!"`
- Multi-syllable: split on syllables (reuse `syllableHint` logic already in the codebase) → `"puppy... pup–py... puppy!"`
- Sight words: `"the... this is a sight word... the!"`

Cached the same way, so each word costs ~1 ElevenLabs call ever. At ~200 unique Pre-K words × 2 modes = ~400 lifetime calls total.

UI:
- Overlay adds a **"Teach me"** button (book icon) that plays the teach clip.
- After the 2nd miss on the same word, we auto-play the teach clip once (existing scaffold hook `scaffoldAfterSecondMiss` — we just swap the audio source).

### 4. Verification

- Playwright: open a Pre-K level, force a wrong answer, confirm overlay shows Retry+Hear+Teach, tap Hear, confirm Retry still clickable, tap Retry, confirm mic re-arms and next attempt scores.
- Check network tab: first Hear on a new word hits `prek-word-tts`; second Hear on same word is a cache hit (no function call).
- Edge function logs clean; no ElevenLabs 4xx.

---

## Technical notes

- **Cost control:** cache-first design means the 20-credit ElevenLabs top-up the user mentioned covers the entire Pre-K word bank essentially forever. No per-play cost after the first play of each word.
- **iOS Capacitor:** `HTMLAudioElement` with a public URL plays fine inside the WKWebView; no native plugin needed.
- **Fallback:** if `ELEVENLABS_API_KEY` is missing or the function returns non-2xx, we transparently fall back to Web Speech so nothing regresses.
- **Not touching K-12 RPG audio** in this change — only Pre-K, where the child-facing voice quality matters most and the word set is bounded.

## One thing I need from you

The **Benny voice ID** from ElevenLabs (the same one you'd paste into Redub Studio). Paste it once and I'll wire it as the default for the whole Pre-K app. If you don't paste one, I'll ship with a solid default ElevenLabs voice (`Charlie` — warm, kid-friendly) that you can swap later per-world.