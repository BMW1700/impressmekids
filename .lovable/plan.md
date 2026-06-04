
# Pre-K Audit — brutally honest

I traced every line of narration and every piece of "Nabu vs Benny" copy. Here is exactly what's broken right now.

## What's wrong with the narrator

1. **The level-select screen still calls everyone the old names.** `src/lib/nabuStoryCopy.ts` is stale:
   - World 101 mission titles say *"Wake Up Nabu Village"*, *"Help the Sleepy Shushie"*.
   - World 102 level chip says *"Wiggle Shushie"* and mission says *"Benny's Bouncy Day"* (Benny is fine, but the chip is nonsense).
   - World 103 says *"Maddy"* everywhere — but the cast you locked in is Matty (the bear). Wrong name.
   - L1/L2/L3 prompts still say *"Nabu Village is sleepy"*, *"Sleepy Shushie is yawning"*, etc.
   So the child hears Benny in the adventure, but sees "Nabu Village / Sleepy Shushie / Maddy" on the cards. Classic mismatch.

2. **In-adventure intro is hardcoded to Benny.** `NabuAdventure.tsx:148` always says *"Let's help Benny! …"* — even if the level is supposed to star Matty or Sally. There is no `star` field on adventures yet (despite the plan saying there would be).

3. **The intro double-says the hero name.** Goal text is already *"Help Benny visit Grandma!"*, so the spoken intro becomes *"Let's help Benny! Help Benny visit Grandma!"* — sounds robotic.

4. **Narration gets chopped off mid-sentence.** `speak()` cancels the previous utterance, and pacing was tightened to 1100ms for the "ask" line and 1400ms for the "problem" line. Real utterances like *"I need something to cross with…"* take ~1600–1800ms. The next phase cancels them before they finish. The kid hears half-sentences.

5. **The "hear it" button fights the narrator.** `playCorrectPronunciation` and `speak()` both use the same `window.speechSynthesis` and call `cancel()` on each other. Tapping the speaker button cuts off the narrator and vice versa.

6. **Inconsistent voice settings.** Narrator uses rate 0.95 / pitch 1.15, success line jumps to rate 1.0 / pitch 1.3, bubble replays use rate 1.05 / pitch 1.25. Same character, three different voices.

7. **No fixed voice selected.** Web Speech picks whatever default the browser has — on most laptops that's a flat US adult voice that sounds nothing like a friendly dog. We never pick a specific `SpeechSynthesisVoice` (Google US English, Samantha, etc.).

8. **Owl ghost code.** `NabuEpisodeIntroOverlay.tsx`, `NabuEpisodeOutroOverlay.tsx`, and `NabuPreKStoryScene.tsx` all still render `<NabuOwl/>` and speak owl-themed lines. They're imported but the Pre-K wrapper bypasses them — so this is dead code that someone (us) will accidentally re-enable.

## Other not-quite-perfect things I noticed

9. Solved phase always says `current.successLine` *or* a generic "Great try!" line — but `speak()` immediately cancels the `playCorrectPronunciation` that just played when the kid got it right. So success chime + spoken word + success line all stomp on each other in the first ~400ms.
10. `MAX_ATTEMPTS = 3` but the warm "Tap to continue" only shows at `attempts >= 2`, *while* the mic is still listening. Either show it earlier (after attempt 1) or hide the mic when it appears.
11. `playCorrectPronunciation` is fired 350ms into the `reading` phase, but the `ask` line's speech is often still finishing. Result: word pronunciation overlaps the prompt.

## The plan to fix it

### A. Single source of truth for character + voice

- Add `star: "benny" | "matty" | "sally"` to `PreKAdventure` in `src/data/preKAdventures.ts`. Default = `benny`. Assign World 102 → `matty`, World 103 → `sally` (matches the cast you locked in). Worlds 101 + everything else stay `benny`.
- Create `src/lib/prekNarrator.ts`:
  - `getStarName(star)` → "Benny" / "Matty" / "Sally"
  - `getStarVoiceProfile(star)` → fixed `{ rate, pitch }` per character (warm dog vs cheerful bear vs gentle horse).
  - `narrate(text, star)` — wraps `speak()`, picks the chosen voice, and **does not cancel** if the same text is already mid-utterance.
  - Selects a preferred `SpeechSynthesisVoice` (Google US English / Samantha / Microsoft Aria) once at boot and caches it. Falls back gracefully.

### B. Rewrite `nabuStoryCopy.ts` to match the cast

- Replace every "Nabu Village / Sleepy Shushie / Wiggle Shushie / Sound Snatcher / Maddy" string with Benny / Matty / Sally copy that matches each world's `star`.
- Level chip per world: 101 → "Benny", 102 → "Matty", 103 → "Sally".
- Mission titles + prompts get rewritten per star (e.g. 103 L1 *"Maddy is stuck…"* → *"Sally is stuck…"*).
- Demo override (`getNabuDemoWords`) untouched.

### C. Fix the spoken flow in `NabuAdventure.tsx`

- Use `narrate(line, adventure.star)` everywhere instead of `speak(…)` directly.
- Intro line becomes `${adventure.goal}` only — no double name.
- Stretch phase timers to fit real utterance length: `problem` 2200ms, `ask` 1900ms, `solved` 2000ms. (Was 1400/1100/1500.)
- Move the auto-pronunciation of the word from 350ms → 1000ms after entering `reading` so the ask line finishes first.
- On `solved`: play chime + sparkle first, wait ~250ms, then narrate the success line (no overlap with the pronunciation playback).

### D. Stop the "hear it" / narrator fight

- In `pronunciationPlayer.ts`, expose a `playWord(word)` that *waits* for `speechSynthesis.speaking` to clear (with a 500ms cap) before speaking, instead of unconditionally cancelling.
- The "Hear it" button calls that. Narrator calls always win during phase transitions; user taps win during `reading`.

### E. Clean up dead owl code

- Delete `NabuEpisodeIntroOverlay.tsx`, `NabuEpisodeOutroOverlay.tsx`, and the now-unused `NabuPreKStoryScene.tsx` exports (they're already bypassed by `NabuEpisodeWrapper`). One less landmine.
- Remove unused `NabuOwl` imports from anything Pre-K.

### F. Small UX nits

- Show the "Tap here to continue" fallback after attempt 1 instead of attempt 2, and pause the mic while it's visible.
- Header shows the active star's name + emoji (🐶 / 🐻 / 🐴) so the visual matches the voice.

## Files touched

- `src/data/preKAdventures.ts` — add `star` field, assign per world.
- `src/lib/nabuStoryCopy.ts` — rewrite all 101/102/103 copy to match the cast.
- `src/lib/prekNarrator.ts` — **new**, single narrator API + voice selection.
- `src/lib/pronunciationPlayer.ts` — non-cancelling `playWord` variant.
- `src/components/aura/game/rpg/NabuAdventure.tsx` — use narrator, fix pacing, fix overlap, header chip, earlier tap-fallback.
- **Delete:** `NabuEpisodeIntroOverlay.tsx`, `NabuEpisodeOutroOverlay.tsx`, `NabuPreKStoryScene.tsx`.

## Out of scope (for this pass)

- New Matty/Sally artwork (still queued).
- Recording real human voice clips instead of Web Speech (would crush quality but costs $).
- Benny blink during adventures (still queued).
