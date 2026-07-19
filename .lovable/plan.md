## Brutally honest audit finding so far

This is not “everything is perfect.” The live Colors level has real integrity problems that can absolutely create the exact kind of chaos you’re seeing.

Confirmed from the backend and code:

- The published level is **Colors With Benny**: world 2, level 1.
- Its word rows are ordered: **Red, Blue, Green, Yellow, ORANGE, Pink**.
- But the backend `sort_order` values are **1,2,3,4,6,7** — there is a missing **5**.
- The runtime player builds scene keys by compact array position: `word-1`, `word-2`, `word-3`, etc.
- Video upload filenames were created from raw `sort_order`, so Orange/Pink are stored as `word-6`/`word-7`, while runtime/audio sees them as `word-5`/`word-6`.
- The current publish check only verifies that files exist. It does **not** prove the correct video is in the correct slot, that word order is contiguous, that redub/music match the current video source, or that stale audio isn’t attached to the wrong scene.

The most likely current failure is **content/data drift**, not a random visual frontend bug: a video/audio slot got out of sync after uploads/deletes/reordering/trimming, and the platform did not block publish or auto-repair the drift.

## Emergency fix plan

### 1. Audit the actual Colors assets, scene by scene
I will inspect the current published Colors level as a timeline:

```text
Opening
Red first clip
Red word card
Red second clip
Blue first clip
Blue word card
Blue second clip
Green first clip
Green word card
Green second clip
Yellow first clip
Yellow word card
Yellow second clip
Orange first clip
Orange word card
Orange second clip
Pink first clip
Pink word card
Pink second clip
Closing
```

For each video scene I will verify:

- Backend word attached to it
- Video storage path
- Trim-in / trim-out
- Redub audio path
- Music path
- Whether the redub/music clip was generated for that exact scene key
- Whether the file assigned to that slot is obviously the wrong source clip

### 2. Repair the live Colors level data
I will fix the live level without deleting the uploaded source files:

- Normalize the Colors word order to contiguous values: **1,2,3,4,5,6**.
- Correct any wrong video path assigned to the wrong word slot.
- Correct any bad prompt/success text that is attached to the wrong word.
- Re-align redub/music rows to the current video trims.
- Remove or replace stale audio clips only where they are proven to be attached to the wrong current scene.
- If a specific redub is genuinely for the wrong source video, I will mark only that affected scene for regeneration instead of rerunning the whole level blindly.

### 3. Fix the root cause so this cannot happen again
I will harden the builder/publish flow:

- After deleting/moving words, automatically reindex word `sort_order` so gaps like **1,2,3,4,6,7** cannot survive.
- On upload/replace video, invalidate stale redub/music for that exact scene so old audio cannot silently remain under a new video.
- Before publishing or “Update Live,” run an integrity check:
  - word orders must be contiguous
  - every word must have first + second video
  - every required video file must exist
  - audio anchors must match the current scene graph
  - redub/music cannot reference scenes that no longer exist
  - trims must be sane and inside source duration
- If integrity fails, block publish with an explicit error instead of letting a broken pilot video go live.

### 4. Add a Super Admin “Level Health” readout
On the Pre-K builder, I will add a small health panel showing:

- Published readiness
- Missing videos
- Sort-order gaps
- Stale redub/music
- Audio/video trim mismatches
- Scene keys that don’t match the current level

This gives you and your intern a clear “safe to publish” signal before pilots.

### 5. Verify with real playback
After the repair, I will run the Colors level end-to-end in the live preview and verify:

- Red plays the correct next clip
- The dog voice follows the correct lips
- The prompt appears only on the word card phase
- Orange does not break the sequence
- Pink and closing still play
- Source video audio stays muted when redub exists
- Redub and music both play in preview/runtime

## What I will not do

- I will not delete the current uploaded video files.
- I will not wipe the backend skeleton.
- I will not blindly rerun expensive voice/music automation unless a specific clip is proven stale or wrong.
- I will not change unrelated RPG/school/pilot features.

## Expected result

Colors With Benny becomes safe again immediately, and the builder gets guardrails so a broken level cannot be published silently before pilot demos.