## Brutally honest audit — Benny voice, prewarm, teach/hear, retry, redub

### 1. Prewarm — 95% perfect

**What actually works (verified in code):**
- `CONCURRENCY = 1` — truly serial. No overlapping ElevenLabs requests. No quality degradation from parallel STS.
- Every request sends `requireIsolation: true`. `prek-word-tts` returns `502 isolation_unavailable` on file #1 if the ElevenLabs key lacks the `audio_isolation` scope — nothing garbled ever enters the cache.
- `eleven_multilingual_v2` (not turbo), per-kind voice_settings tuned for a 4-year-old's ear (higher stability, speaker_boost on).
- Wake lock acquired on start, released on finish/cancel/error. Laptop won't sleep mid-run.
- Cancel uses `useRef` — actually stops the loop, no stale-state bug.
- Storage probe rebuilds the queue from the **actual** contents of the `prek-word-tts` bucket. Cached files are skipped unless `force=true`. Re-probes after finish.
- Verify sample downloads 10 random MP3s and flags any <4 KB as broken silence.
- Purge action nukes both `v2/*` and `v3/*` poisoned prefixes for super_admins only.

**One real gap:**
- The edge function still has a **legacy `mode: "teach"` code path** that builds a single stitched sentence ("A... buh... at!"). Nothing in the current app calls it — `bennyTeach.ts` uses segments and `bennyVoice.ts` uses `mode: "say"`. But it's live, cache-key `v3/teach/*`, and any old client that survives will silently create new poisoned files. Remove it and reject the mode server-side.

### 2. Teach & Hear in-game — perfect *if* prewarm succeeded

- `bennyVoice.ts` (Hear): cache-first signed URL from edge function, falls back to Web Speech only on error. No overlapping playback (`stopBenny` before each play).
- `bennyTeach.ts` (Teach): **serial** segment fetch + playback (parent complaint was overlaps — fixed). Code-controlled gaps per pace toggle. Abort controller stops mid-run.
- `stopInstructionAudio()` in `RPGWordReader` calls **both** `stopBennyTeach()` and `stopBenny()`. It runs at the top of `handleTryAgain`, `handleContinueAfterMiss`, and mic restart paths. Teach can't leak into the mic after Retry.

The catch: none of the above matters if the cache is still poisoned. Order is non-negotiable: **Nuke → Prewarm → Verify → then test in-game.**

### 3. Retry button — the code path is correct

Traced `handleTryAgain` end-to-end (RPGWordReader.tsx:690–756):
1. `stopInstructionAudio()` — kills any playing Hear/Teach audio.
2. Aborts stale `SpeechRecognition` instance (fix for Chrome/Safari's async `.stop()` race).
3. Clears the feedback overlay, resets `isProcessingRef`, `batchCompletedRef`, `processedFinalsRef`.
4. **Re-arms the speech target token** for the same word index — previously the old token was still marked "consumed" and the retry transcript was rejected as "target not armed". This is fixed.
5. Restarts the mic after 260–420 ms (pace-dependent) so Chrome accepts the new session.

I still want a real-browser verification pass because this is the exact bug the user has been burned by twice. Playwright will drive: read word → force miss → click Try Again → verify mic goes green and a new transcript is processed.

### 4. Redub — perfect for the pipeline, quiet gap in the UI

Verified in `supabase/functions/prek-clip-redub/index.ts`:
- Isolate → STS → upload isolated stem AND final MP3 → merge into `redub_audio_paths` → **auto-create the "Benny (Redub)" track (index 90)** → **upsert one redub clip per scene** → auto-enable `mute_source_video_audio`.
- Layering "just happens" — every redubbed scene lands on the same top-priority track, source video audio gets muted the same call. No manual timeline work needed.

Gap: `RedubStudioPanel` shows the final MP3 preview but doesn't explicitly surface "this clip is now on the timeline at track 90" — the user's complaint that layering is "mostly decorative" was actually a UI communication gap, not a data gap. Fix is a small badge/toast.

### Fixes to ship

1. **Edge function** — remove the dead `mode: "teach"` branch from `prek-word-tts/index.ts`, return `400 legacy_teach_mode_removed`. Prevents any future poisoning at `v3/teach/*`.
2. **Prewarm UI** — after purge, also invalidate the in-memory `saySet` / `segByKind` immediately (currently only after re-probe finishes; brief window where "cached" rows still show).
3. **Retry verification** — Playwright script: load a Pre-K level as a real signed-in super_admin, force a miscue, click Try Again, assert (a) `[RPGWordReader]` retry log line appears, (b) mic state transitions `waiting_action → listening`, (c) a fresh transcript is processed within 5 s. Fail loudly if any step misses.
4. **Redub panel** — show a small `On timeline · track 90 · source audio muted` confirmation next to the Final Audio preview after a successful redub, so you can see layering happened without opening the timeline.

### Straight answer to your question

- **Prewarm perfect?** Yes, provided the ElevenLabs key has `audio_isolation` scoped. If not, it hard-fails on file #1 with a red toast — no garbage enters cache. After fix #1 there's no other silent poisoning path.
- **Teach + Hear will sound perfect?** Yes, once you Nuke → Prewarm → Verify shows 10/10 ✅ with reasonable KB sizes. The code that plays them is already correct.
- **Retry will work?** The code says yes and I'll prove it with a Playwright run before I claim done. If the Playwright pass fails, I fix whatever it exposes in the same turn.
- **Redub perfect?** The pipeline is. UI-wise you'll get the missing "layered on track 90" confirmation.
