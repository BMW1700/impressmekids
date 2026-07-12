## Brutally honest audit

The current failures are not one single bug. There are three separate issues:

1. **Benny Teach audio is too aggressive and overlapping**
   - The game calls the segmented Teach flow, but the client currently fetches every segment at once.
   - The prewarm tool also runs multiple generation workers at once.
   - That is risky for short child-facing phonics clips because cached/generated segments can arrive under load while the user taps Hear/Teach/Retry, making playback feel garbled or repeated.

2. **The Retry/Hear/Teach buttons are fighting microphone + audio state**
   - After a wrong answer, the overlay pauses the mic, but Teach/Hear playback is not consistently stopped before Retry.
   - Retry starts the mic again very quickly after stopping the old recognition session. On Chrome/Safari this can silently fail, which looks exactly like “Reading…” but nothing is actually processed.

3. **Redub Studio UI is showing too many technical outputs**
   - “Iso”, “Redub”, and “Iso only” are all valid internal pipeline steps, but for workflow they are confusing.
   - The final useful thing is the redubbed audio. That should be the main preview/play button.
   - The backend already auto-places successful redubs on a Benny (Redub) timeline track; the UI should make that obvious and provide a clean layer/refresh action.

## Plan

### 1. Make Teach playback serial and non-overlapping
- Update `src/lib/bennyTeach.ts` so Teach fetches and plays one segment at a time instead of firing all segment requests in parallel.
- Add a single active Teach controller so tapping Teach again cancels the previous lesson cleanly.
- Ensure `stopBennyTeach()` fully aborts pending segment playback, not only the current audio element.
- Keep the default Teach pace slow for Pre-K.

### 2. Remove the repeating/garbled Teach sequence
- Update `src/lib/phonicsSegmenter.ts` so short words do not say the whole word at the beginning and end.
- New flow for short Pre-K words:
  - “Let’s sound it out.”
  - isolated phoneme sounds one by one
  - blended sound-out
  - final whole word
- This removes the “word repeats word repeats word” feeling while still following phonics/science-of-reading style instruction.

### 3. Make Benny Voice Prewarm safe-quality instead of fast-but-risky
- Change `src/pages/superadmin/BennyVoicePrewarm.tsx` from concurrency 4 to serial generation by default.
- Stop generating the deprecated legacy `teach` MP3s, because the app now uses segmented Teach and those legacy full-lesson clips are the ones most likely to sound awful.
- Keep `say` MP3s and segmented phonics MP3s.
- Update totals/progress labels so the dashboard reflects the actual generation work.

### 4. Fix Retry/Hear/Teach button reliability in the game
- Update `src/components/aura/game/rpg/RPGWordReader.tsx` so:
  - Retry always stops Benny Teach and Benny word audio first.
  - Hear always stops Teach before playing the final word audio.
  - Teach always stops the mic and previous audio before starting the lesson.
  - Retry waits slightly longer before restarting speech recognition so the old browser mic session is truly gone.
  - The overlay remains stable after Hear/Teach; the Retry button does not disappear or become dead.

### 5. Simplify Redub Studio to final audio first
- Update `src/components/superadmin/prek/RedubStudioPanel.tsx` so each row primarily shows:
  - **Final Audio** play button when redub exists.
  - **Redub / Regenerate** action.
  - **Layered** status indicating it has been placed on the Benny (Redub) track.
- Hide the separate “Iso” preview by default to avoid confusion.
- Keep “isolation test” available as a smaller advanced action, since it is still useful before spending Speech-to-Speech credits.

### 6. Verify the real failure paths
- Check recent backend function logs for `prek-word-tts` and `prek-clip-redub` after the changes.
- Test the Teach/Hear/Retry UI flow in the browser preview.
- Deploy the edited backend function only if backend function code changes are needed.

## Expected result

- The child hears clear, separated phonics instruction instead of garbled/repeated audio.
- Hear, Teach, and Retry no longer break each other.
- Retry restarts actual listening, not just the visual “Reading…” state.
- Redub Studio becomes simple: generate final audio, preview final audio, and use the auto-layered Benny track in the timeline.