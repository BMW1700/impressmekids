## Goal
Get every Benny clip re-voiced in your cloned ElevenLabs voice, perfectly lip-synced, in one sitting — with a splice tool to trim stutters first.

## What's already done (from last turn)
- **Waveform on Track 1 is fixed** → you'll now see the source audio to line up against.
- **`prek-clip-redub` edge function is live** → downloads a source clip, sends it to ElevenLabs Speech-to-Speech (STS) with your Benny voice, saves the MP3 to Storage, records the path on `prek_levels.redub_audio_paths`.
- **Database is ready** → `redub_voice_id`, `redub_audio_paths`, `redub_stability`, `redub_similarity_boost`, `redub_generated_at` all exist on `prek_levels`; `prek_worlds.redub_voice_id` exists for world-level defaults; `prek_redub_jobs` table exists for progress tracking.

## What I'll build this turn

### 1. Redub Studio panel (in the level builder)
A new card inside `AudioMixEditor.tsx` with:
- **Voice ID field** — paste your ElevenLabs Benny voice ID once, saves to the level (defaults from `prek_worlds.redub_voice_id`).
- **Stability / Similarity sliders** — with sensible defaults (0.5 / 0.85).
- **Per-clip "Redub" button** — next to each scene in the timeline; runs one clip, shows spinner, then a green ✓ + a ▶ preview button that plays the new MP3.
- **"Redub entire level" button** — runs every scene sequentially with a progress bar (X of Y done), writing to `prek_redub_jobs`. Retryable on failures.
- **"Redub entire world" button (world editor)** — iterates all published levels in the world.

### 2. Playback swap in the student app
Update `usePreKLevelVideoUrls.ts` to also resolve `redub_audio_paths` → signed URLs, and update the Pre-K player to:
- Mute the source video track
- Play the redubbed MP3 in sync with `video.currentTime`
- Fall back to source audio if no redub exists for that scene

### 3. Micro-splice tool (Video track)
Add a "Splice" mode toggle on Track 1. When on:
- Click-drag on the video waveform to select a region → "Cut selection" removes those seconds from the source clip's effective playback (stored as `trim_ranges` jsonb on the word row — a list of `[startSec, endSec]` chunks to skip).
- The redub function passes the trimmed audio to ElevenLabs, so stutters/repeated words never enter the STS input.
- Non-destructive: original MP4 stays intact; you can clear splices any time.
- Requires a new migration to add `first_trim_ranges` / `second_trim_ranges` jsonb columns to `prek_level_words` and `opening_trim_ranges` / `closing_trim_ranges` to `prek_levels`.

## Your workflow once shipped
1. Open a level in the super admin editor.
2. Paste your ElevenLabs Benny voice ID (once per world — it inherits down).
3. **(Optional)** Turn on splice mode, cut out any stutters/repeat words on Track 1.
4. Click **"Redub entire level"** → wait ~30-60s per clip (STS is roughly 2× realtime). A 10-clip level finishes in ~5-10 minutes.
5. Hit ▶ preview inline — Benny's voice, original timing, lip-sync intact.
6. If one clip sounds off, click its per-clip **Redub** button to regenerate just that one.
7. Publish. Student app automatically uses the redubbed track.

## Technical notes
- STS uses the source cadence as a template, so lip-sync is preserved automatically — no manual alignment needed.
- Redub MP3s are stored under `prek-level-videos/redub/<levelId>/<sceneKey>-<timestamp>.mp3`. Old redubs are kept (not deleted) so you can roll back by editing `redub_audio_paths` jsonb.
- All calls are gated to `super_admin` and `content_editor` roles.
- Rate limit: ElevenLabs allows ~10 concurrent STS requests on paid tiers. We run sequentially per level to stay safe; the world-level button chunks 3 levels in parallel.
- Cost: STS is billed per character-equivalent (~1000 chars ≈ 1 min of audio). A 30-second Benny clip ≈ 500 chars.

## Files touched
- `src/components/superadmin/prek/AudioMixEditor.tsx` — Redub Studio panel + splice toggle
- `src/components/superadmin/prek/TimelineCanvas.tsx` — splice-mode overlay + per-clip Redub buttons
- `src/hooks/usePreKLevelVideoUrls.ts` — resolve `redub_audio_paths`
- `src/hooks/useBennyRedub.ts` — new orchestrator hook (progress, retries)
- `src/components/aura/game/rpg/prek/PreKPlayer.tsx` (or equivalent) — playback swap
- `src/pages/superadmin/PreKWorldEditor.tsx` — world-level Redub + voice ID
- `supabase/migrations/...` — add trim_ranges jsonb columns

## Ready to build?
Approve and I'll ship all of the above in the next turn. After that you'll be redubbing full levels end-to-end.
