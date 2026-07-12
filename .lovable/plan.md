## Brutally honest audit

**Redub pipeline (backend):** Solid. `prek-clip-redub` isolates → STS → uploads MP3 → merges into `redub_audio_paths` → auto-creates the "Benny (Redub)" track (index 90) → upserts a clip anchored to the scene with `duration_mode: "fill-scene"` and `anchor_offset_seconds: 0` → mutes source video audio. That means every successful redub is *already* placed on the timeline aligned to the original clip's start.

**What's actually broken vs. what you asked for:**

1. **"Beneath the original with waves showing, lined up perfectly"** — Half-working. The clip lands on track index 90, which sorts to the *bottom* of the lane list (because tracks render in order), not immediately below the Video lane. The waveform IS drawn (via `ClipWaveform` + `signedUrls`), but visually it's buried under any manual tracks the editor created first. That's why it doesn't feel "lined up beneath the original."
2. **Whole-level redub** — Works (`redubAll` iterates serially). No progress bar per-clip on the timeline itself, only in the Redub Studio panel.
3. **Prewarm / teach / hear** — Backend is correct after the last pass (isolation-required, legacy `teach` mode rejected, `v3`/`v4` cache namespaces, wake lock, verify-10). Only risk left: if a cached MP3 was generated before the isolation-required patch, it's still poisoned — the Nuke + re-prewarm has to actually be run.
4. **Retry button in Benny levels** — Code path is correct (`stopInstructionAudio` → abort stale recognition → re-arm target token → restart mic + `showFeedbackOverlay` guard). No known bug in source, but I have not been able to verify it end-to-end in a real mic session — Playwright can't spoof `SpeechRecognition` results meaningfully.
5. **Redub Studio UI** — Preview + "On timeline · track 90 · src muted" badge exist, but there's no inline waveform in the Studio panel itself; you have to switch to the Audio Mix tab to see the wave. That's a UX gap given your ask.

## What I'll build

### A. Pin the Redub track directly under the Video lane
- In `TimelineCanvas.tsx`, split rendering: render the "Benny (Redub)" track (track_index 90) as a **fixed lane immediately below the Video lane**, before all other user tracks. Everything else keeps its current order.
- Redub clips get a distinct violet/emerald color and a "🔒 Auto-aligned to source" chip so it's obvious they're locked to the scene start.
- The waveform (`ClipWaveform`) already renders — the fix is purely lane-ordering + styling so it visually sits beneath its source video clip at exactly the same left/width.

### B. Per-clip + whole-level redub visible on the timeline
- Add a small floating **"Redub this clip"** action on hover of any Video-lane block → invokes `redubScene` for that scene, spinner shows in-place, wave appears in the pinned Redub lane on completion.
- Add **"Redub entire level"** button in the timeline toolbar (mirrors the Studio panel). Progress renders as a subtle overlay on each Video block (`n / total`).

### C. Redub Studio panel gets inline waveforms
- In `RedubStudioPanel.tsx`, render a `ClipWaveform` beside each row for the final redub MP3 (using existing signed URL). No new backend calls.

### D. Cache-safety guard so "garble" can't come back
- Add a one-time boot check in `BennyVoicePrewarm.tsx`: if any cached file is < 4 KB, surface a red banner "Poisoned cache detected — Nuke required" and disable prewarm until Nuke is run. Prevents accidentally shipping garble to production.

### E. Retry button — belt-and-suspenders
- In `RPGWordReader.tsx`, add explicit `stopBenny()` + `stopSegmentedTeach()` calls at the very top of the retry handler (before re-arming recognition), so no stray audio leaks into the mic. Also add a console log line `[retry] rearmed target=<word>` so if it ever fails again in real use, we can diagnose in one message.

### F. What I will NOT claim
- I cannot promise "perfect" ElevenLabs output — that depends on their model + your source audio quality. But with isolation-required + serial concurrency, it's as good as their API allows.
- I can't unit-test the mic-driven retry path headlessly. If it misbehaves on a real device, send the console line above and I'll fix in one turn.

### Technical touchpoints
```text
src/components/superadmin/prek/TimelineCanvas.tsx   — pin Redub lane, hover redub button
src/components/superadmin/prek/RedubStudioPanel.tsx — inline waveforms
src/pages/superadmin/BennyVoicePrewarm.tsx          — poisoned-cache boot check
src/components/aura/game/rpg/RPGWordReader.tsx      — retry hardening + log
```

No schema changes. No new Edge Functions. No new secrets.
