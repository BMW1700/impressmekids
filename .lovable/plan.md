Brutally honest audit: the video level was not actually using the proven regular reader capture stack. It was showing a custom “Listening” label, but the real working controls/state machine from the regular Pre-K word reader were not there. The custom listener also only reacted to final transcripts, so if the browser stayed on interim speech or the recognition session failed/restarted silently, the UI looked active while nothing advanced.

Plan to fix it:

1. Replace the custom word-phase microphone path in `NabuVideoAdventure.tsx` with the same proven `RPGWordReader` component used by regular levels.
   - Render only one word at a time: `words={[wordStep.word]}`.
   - Use `batchSize={1}` and `autoStart` so the mic starts when the word appears.
   - Keep the video-level luxury word card look by using the existing overlay shell, but put the real reader controls directly beneath it.

2. Keep the buttons the user requested.
   - Show the `Hear` button.
   - Show the `Reading...` mic button while active.
   - Allow pausing/resuming the mic using the regular reader controls.
   - Keep the listening waveform/status from the working reader instead of the fake custom status.

3. Stop “I need to...” from repeating.
   - Remove/cancel any TTS replay behavior tied to the ask bubble after the first prompt.
   - Make the ask bubble text remain visible, but not clickable for replay during the word-reading phase.
   - Guard prompt audio by a per-step ref and cancel speech before entering mic mode so it cannot overlap/re-trigger.

4. Preserve the video adventure loop.
   - Clip plays with audio.
   - Video pauses/freezes on the final frame.
   - Text remains: “I need to...”
   - Word appears: “JUMP”.
   - Child says “jump”.
   - The regular reader detects it.
   - On correct, submit the word/audio context to the backend path, then transition to the next video clip.

5. Keep backend/AURA submission intact.
   - Continue using `submitPreKAuraReading` after the word is resolved.
   - Pass expected word, spoken word, step index, attempts, and match status.

6. Add diagnostic logging only around the video word phase if needed.
   - Log when the word reader starts, when it returns a result, and when the clip advances.
   - Keep logs minimal and remove/avoid noisy UI changes.