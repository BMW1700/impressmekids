## Priority 1 — Benny Voice Prewarm: Rebuild It Right

**The problem:** The cached MP3s powering "Hear" and "Teach" in the Pre-K reader are garbled — repeated syllables, warped phonemes, mangled words. Root cause: the last bulk run went out concurrent, without Audio Isolation on the API key, and re-cached broken audio on top of the good keys in R2. Serial mode is now set in code, but the poisoned cache is still what kids hear.

**Fix, end to end:**

1. **Purge the poisoned cache first** (destructive, one-time)
   - Add a "Nuke Benny cache" action in `BennyVoicePrewarm.tsx` that deletes every object under the `benny-voice/` prefix in R2 AND clears the matching rows in the cache table.
   - Confirm dialog with typed "DELETE" to prevent accidents.

2. **Rebuild `prek-word-tts` for perfection, not speed**
   - Force `model_id: eleven_multilingual_v2` (highest quality, not turbo) for word + phoneme + letter segments.
   - Locked voice settings tuned for a 4-year-old's ear: `stability 0.65, similarity_boost 0.85, style 0.15, speaker_boost true, speed 0.95`.
   - Wrap each generation in: TTS → **Audio Isolation pass** → store. Isolation strips the ElevenLabs "breath/room" artifacts that sound garbled to kids.
   - Retry once on any non-2xx; on second failure, mark the row `failed` (do NOT overwrite the existing good cache key).
   - Write to a **new key namespace** (`benny-voice-v2/…`) so a bad run can never overwrite a good one again. The client reads v2, falls back to v1 only if v2 is missing.

3. **Serial, resumable prewarm UI**
   - `CONCURRENCY = 1`, 400 ms jittered delay between calls (well under ElevenLabs' per-second cap).
   - Progress bar shows current word + segment (word / each phoneme / each letter).
   - **Preview-before-commit:** each generated clip lands in a "pending" state; superadmin clicks ▶ to audition, then ✅ Approve or ✗ Regenerate. Only approved clips get promoted to the live `benny-voice-v2/` prefix.
   - Bulk "Approve all in this word" button once you trust the pipeline.
   - Resumable: refresh mid-run and it picks up where it stopped from the DB state.

4. **Unblock Retry / Hear / Teach in the game**
   - Audit `RPGWordReader.tsx` + `bennyTeach.ts` end-to-end: the `stopInstructionAudio` guard added last turn is correct in theory but the buttons are still dead in the wild. Trace with a live browser session (Playwright) — click Retry after a miss, capture console + network, and fix whatever's actually blocking the state transition (likely a stuck `showFeedbackOverlay` or an un-awaited `.play()` promise).

## Priority 2 — Redub Studio: Real Layering, Real Final Audio

**The problem:** Right now the Redub panel shows Original / Isolated / Redub buttons and a "Layered" badge that is decorative — nothing actually places approved clips onto the timeline.

**Fix:**

1. **Simplify the panel**
   - Remove the Original + Isolated preview buttons. One preview button: **▶ Final** (isolated → redubbed track). This is what ships.
   - Per-clip actions: `Approve` / `Regenerate` / `Reject`.

2. **Real "Layer approved tracks" pipeline**
   - New button: **📌 Layer all approved onto timeline**.
   - Backend action (`migrate-to-r2` sibling function `prek-layer-approved`) walks approved redub clips for the level, and for each one:
     - Inserts a row into `prek_level_audio_clips` with `track = 'benny-redub'`, `start_ms` = the original clip's `start_ms`, `duration_ms` = redub file duration, `source_url` = the R2 final-audio key.
     - Soft-deletes (or mutes) the matching original-vocal clip on `track = 'vocals'` so they don't stack.
   - Frontend refreshes `usePreKAudioMix` — the redub clips appear on a new lane in `TimelineCanvas`, perfectly aligned lip-to-lip because we reused the original `start_ms`.
   - "Undo layer" button that restores the muted originals and removes the benny-redub lane.

3. **Per-level voice locking**
   - Voice ID selector at the top of Redub Studio (default: current Benny voice). Whatever's selected when you hit "Layer approved" is stamped onto every clip's metadata so future re-renders stay consistent.
   - Switching voice ID mid-level warns: "This will invalidate approved clips for this level."

## What I'm explicitly NOT touching this pass

- Timeline zoom / undo (nice-to-have, not blocking dubbing).
- R2 migration dashboard (already at 100% functional copies; ghost failures purge exists).
- 100k-user scaling (conceptual, no code impact on shipping the reader).

## Order of operations

1. Nuke cache → rebuild `prek-word-tts` with isolation + v2 namespace → serial prewarm UI with approve-per-clip.
2. Playwright-verify Retry/Hear/Teach in the live game with the new cache.
3. Redub panel simplification → `prek-layer-approved` function → timeline layering + undo.

Approve this and I'll build it in that exact order.