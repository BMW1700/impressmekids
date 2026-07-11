# Benny Redub + Editor Fix — Simple Plan (v4)

**Brutal honest recommendation: drop Fly.io/Inngest.** You don't need them. Your bottleneck isn't infrastructure — it's that we were rushing clips through ElevenLabs in parallel. Fix the pacing and the quality problem disappears. One vendor (ElevenLabs), one Edge Function, done.

If you ever hit a wall (e.g. redubbing 50 worlds in one night), we add a worker later. Not now.

---

## What I'll build

### 1. Redub pipeline — slow & perfect
Inside the existing `prek-clip-redub` Edge Function:
- **Serial processing**: one clip at a time, never parallel. No rate-limit collisions.
- **Auto-split long clips**: anything over ~20s gets split at natural silences, redubbed in pieces, and stitched back. Prevents ElevenLabs quality drop.
- **Fixed pipeline order** (what you described exactly):
  1. Original audio → ElevenLabs **Voice Isolator** (strips background noise/music)
  2. Isolated audio → ElevenLabs **Speech-to-Speech** in Benny's locked voice
  3. Result → saved back to R2 + linked to the level
- **"Redub entire world" button**: fans out across all levels in a world, still serial, with live progress + per-clip status.
- **Retry-on-fail**: any single clip that comes back weird gets one automatic retry before being flagged.

### 2. Benny voice — locked
- You give me the ElevenLabs voice ID → I hardcode it as `BENNY_VOICE_ID` in the function.
- Swapping later = change one constant + click "Redub entire world" again. No lock-in fear.

### 3. Editor — bi-directional crop + splice (the real fix)
Root cause of the "can't drag crop back out" bug: the code clamps the trim handle against the *already-cropped* visible edge instead of the *raw* audio duration. Fix:
- Store `source_duration_seconds` on the clip when uploaded (currently missing — this is why the math breaks).
- Left/right trim handles clamp against **raw** duration, not visible duration. You can crop tight, then drag back out to reveal the original audio. Effortless, matches the cinematic timeline behavior.
- **Splice** = split clip at playhead (or at where you click). Produces two independent clips you can trim/move/delete separately.
- Keyboard: `S` = split at playhead, `Delete` = remove selected, `Cmd+Z` = undo.

### 4. Teach / Hear — the ELLO killer
- **Hear** button: plays the whole word in Benny's locked voice (cached MP3, instant).
- **Teach** button: plays phoneme-by-phoneme → blend → whole word → used-in-sentence. Each segment is a pre-generated ElevenLabs clip cached in R2, so it plays instantly and sounds identical every time.
- Pre-warmed on level publish so kids never wait.
- No mid-word interruption bug: the "Hear" button won't hijack an in-progress "Teach" sequence.

---

## What I'm explicitly NOT doing (and why)

| Skipped | Why |
|---|---|
| Fly.io worker | Edge Function handles it if we go serial. Adds a whole second system to debug. |
| Inngest queue | Same — overkill for your volume. |
| New vendors | ElevenLabs does isolation + STS + TTS. That's the whole pipeline. |
| BKT / SoR evidence schema | Separate initiative. Doesn't block audio quality. Revisit after Benny sounds perfect. |
| Voice A/B registry | You said lock it. I'll hardcode. Swappable in one line if you change your mind. |

---

## Order of work

1. **Editor fix first** (crop bi-directional + splice + undo) — unblocks you today, zero backend risk.
2. **Redub pipeline rewrite** (serial + auto-split + isolator→STS chain) — makes the "Redub world" button actually sound good.
3. **Teach/Hear polish** — pre-generate and cache segments, fix the interruption bug.

---

## Technical notes (for reference)

- Files touched: `TimelineCanvas.tsx`, `AudioMixEditor.tsx`, `preKClipMath.ts`, `usePreKAudioMix.ts`, `supabase/functions/prek-clip-redub/index.ts`, `RPGWordReader.tsx`, `bennyVoice.ts`.
- One migration: add `source_duration_seconds numeric` to `prek_level_audio_clips`, backfilled from existing `duration_seconds`.
- Concurrency = 1. Per-clip timeout = 90s. Auto-split threshold = 18s. Silence detection via simple RMS threshold in the function (no ffmpeg needed for MP3 slicing at silence — we use ElevenLabs' own word timestamps from a quick STT pass to find split points).

---

**Approve this and I'll start with the editor fix so your content team is unblocked within the hour.** Then the redub rewrite. Then Teach/Hear.
