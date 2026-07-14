## Brutally honest audit

**Do I know what the issue is? Yes.**

The LALAL music stem did **not** disappear. The stem files exist in backend storage. The problem is the **Track 89 timeline metadata** and the **runtime cutoff behavior**.

### What is actually broken

1. **The previous Track 89 repair was incomplete.**
   - It changed music clips to `fixed`, no-loop, and pause-on-word-card.
   - But it did **not** backfill correct clip duration/trim data.
   - Result: existing music clips now behave like broken 1-second/unknown-length one-shots.

2. **The editor compresses Music because duration is missing or wrong.**
   - Current Track 89 database rows include music clips with `duration_seconds = null`.
   - The timeline renderer treats missing fixed duration as `1 second`.
   - One current music clip is explicitly `duration_seconds = 1` and `trim_end_seconds = 1`.
   - That is why the blue Music blocks look tiny/disappeared instead of matching the redub/video scene width.

3. **Published/runtime playback mutes because source video audio is muted and Track 89 is too short/badly bounded.**
   - Source video audio is correctly muted so original Benny voice does not leak.
   - But Track 89 is not correctly spanning the scene.
   - So when the music clip ends instantly or gets cut early, there is no fallback audio, which sounds like the music was muted.

4. **Redub should not be touched.**
   - Track 90 redub is working.
   - The fix must be isolated to Track 89 music/background stems and shared display/runtime safeguards.

## Fix plan

### 1. Repair all existing Track 89 music clips
Backfill current music clips so they match the visible video scene:

- Opening music uses opening video duration/trim.
- Closing music uses closing video duration/trim.
- `word-N-first` music uses that word's first video duration/trim.
- `word-N-second` music uses that word's second video duration/trim.

Each repaired Track 89 clip will be:

```text
duration_mode: fixed
source_kind: music
track_index: 89
loop_clip: false
pause_on_word_card: true
duration_seconds: source raw video duration
trim_start_seconds: source video trim-in
trim_end_seconds: source video trim-out, or raw duration if no trim-out
```

This makes the Music lane visually line up under Redub again.

### 2. Harden the Music extractor for future runs
Update the music extraction function so new LALAL clips can never save null/1-second timeline metadata again:

- Always calculate a finite duration.
- Always calculate a finite trim end.
- If source raw duration is unavailable, fall back to scene duration.
- Keep Track 89 directly below Track 90.
- Keep source video muted after successful redub/music generation.

### 3. Make Track 89 stop at scene boundaries immediately
Change runtime behavior only for music/background stems:

- On scene end, Track 89 fades/stops immediately.
- On word-card start, Track 89 fades/stops immediately.
- Track 89 never uses the redub 2-second voice tail.
- Track 89 never causes freeze-hold.

Redub keeps its current tail behavior unchanged.

### 4. Add a defensive timeline display fallback
Even if an old/bad Track 89 row ever has missing duration again, the editor should render it across the anchored scene instead of collapsing to a tiny 1-second block.

### 5. Deploy and verify
After implementation:

- Apply the backend repair.
- Deploy the updated music extraction function.
- Verify the current level's Track 89 rows have real durations/trims.
- Confirm Track 89 is visible under Track 90 and no longer muted in runtime.

## Expected result

Track 89 will sit directly under Track 90, span the same scene window, play with the redub during video scenes, stop for word boxes, and never freeze the video.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>