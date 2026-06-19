## Honest audit — what's right, what's wrong

### What was implemented correctly
- **DB migration**: nullable `*_trim_in_seconds` / `*_trim_out_seconds` on `prek_levels` (opening/closing) and `prek_level_words` (first/second). Safe, additive.
- **Scene graph effective duration**: `buildSceneGraph` now uses `hi − lo` so audio anchors recompute against the trimmed length. Audio anchored to "scene end" correctly fires at trim-out, not native end. ✅
- **DB→runtime mapping**: `buildVideoLevelFromDb` passes `trimIn`/`trimOut` through into every `VideoStep`. ✅
- **Runtime trim enforcement**: `trimsBySrc` map, `seekToTrimIn` on `onLoadedMetadata`/`onLoadedData`, and `handleTimeUpdate` synthesizing an early `handleClipEnded` at `currentTime >= trimOut − 0.02`. ✅
- **Builder wiring**: `VideoTrimEditor` mounted in all 4 slots, `updateLevelTrim` / `updateWordTrim` patch the right rows with optimistic local state. ✅
- **Clear-video flow** (`clearLevelVideo`) correctly nulls trim columns alongside the URL. ✅

### What is genuinely broken or sloppy (4 real issues)

1. **Replace-video does NOT reset trims** — `uploadLevelVideo` and the equivalent word upload path overwrite the file but leave `trim_in/out` from the OLD clip in place. New clip plays with stale, almost-certainly-wrong cut points. This is a real bug, not theoretical.

2. **Editor preview lets you scrub past the trim region** — `VideoTrimEditor` uses native `<video controls>` with no enforcement of trim-in/out. Admins setting cut points can be confused because the preview keeps playing through the "removed" tail. The runtime is correct; only the editor is misleading.

3. **First-frame flash of the un-trimmed start during crossfade** — runtime seeks to `trimIn` on `onLoadedMetadata`, but on some browsers (Safari especially) the first painted frame can be frame 0 before the seek lands. With a 600 ms crossfade you can briefly see the junk frame we're trying to cut. Fix: keep the slot's `opacity: 0` and don't start playing/crossfading until we've confirmed `currentTime >= trimIn` (one `seeked` event).

4. **TS strictness risk on computed-key updates** — `update({[`${slot}_trim_in_seconds`]: value})` works at runtime but loses column-typing. Low priority; flagging for honesty.

### What's NOT broken but worth knowing
- Crop (Phase 2) was never started — only trim shipped. That was the agreed scope.
- AudioMixEditor's own timeline uses the scene graph, so trims propagate into the audio editor view for free.
- Default-duration fallback (`DEFAULT_VIDEO_SECONDS = 5`) means a level with no probed duration + a trim_out still produces a sane `Math.max(0.1, hi − lo)` instead of negative time.

---

## Proposed fixes (small, surgical)

### Fix 1 — Reset trims on Replace
In `uploadLevelVideo` and the word-video upload, include `trim_in_seconds: null`, `trim_out_seconds: null` (and the matching `*_duration_seconds: null` so the backfill re-probes) in the `update` payload after a successful upload.

### Fix 2 — Enforce trim in the editor preview
In `VideoTrimEditor`:
- On `onTimeUpdate`, if `playhead >= effOut − 0.02`, `video.pause()` and seek back to `effIn`.
- On `onLoadedMetadata`, seek to `effIn` instead of 0.
- When the user drags the In handle past current playhead, seek; when they drag Out before playhead, pause+seek to Out.

### Fix 3 — Hide first frame until seek lands
In `NabuVideoAdventure.renderSlot`:
- Track `seekedSrcs` set. On `onLoadedMetadata`, call `seekToTrimIn` AND mark a pending state.
- Only call `handleVideoReady(slot)` (which kicks off `playSlot`) on the `onSeeked` event for that slot when a `trimIn > 0` is configured. For trimIn = 0 keep current behavior.
- Keep incoming `opacity: 0` until `onPlaying` (already the case).

### Fix 4 — Type the trim updates
Replace computed-key object with explicit branches (4 columns × 2 tables, trivial). Optional polish, not required.

### Files touched
- `src/pages/superadmin/PreKLevelBuilder.tsx` (Fix 1, Fix 4)
- `src/components/superadmin/prek/VideoTrimEditor.tsx` (Fix 2)
- `src/components/aura/game/rpg/NabuVideoAdventure.tsx` (Fix 3)

No DB migration, no schema changes, no edge functions.

### Verdict
The implementation is **mostly correct and the architecture is sound** — non-destructive metadata, scene-graph integration, runtime enforcement all wired right. But it's not "absolutely correct": the Replace-resets-trim bug is the one that will bite a real admin first, and the editor preview not honoring its own trim makes the tool feel half-built. Fixes above are ~60 lines total.
