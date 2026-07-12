## Brutal audit — what's actually wrong

I re-read both deployed edge functions and the orchestrator. Most of the pipeline is solid: auth + role check, isolation → STS chain, LALAL upload → phoenix split → back_track download, DB merges into `redub_audio_paths` / `redub_isolated_paths` / `music_audio_paths`, timeline auto-place with UNIQUE(level_id, track_index) protecting against duplicate tracks, retries on 5xx, music no longer pausing on word cards, source video auto-muted.

Three real problems remain. One is a **ticking time bomb** on longer clips.

### 🔴 Critical — LALAL 8-minute poll will die inside the edge function

`prek-clip-music-extract` polls LALAL for up to **8 minutes** in a single HTTP request. Supabase Edge Functions have a **~150s wall-clock limit** (400s on higher tiers). Any clip that LALAL takes >2 min to split will:

- kill the function mid-poll with a 546/worker-timeout,
- lose the `fileId` (never persisted anywhere),
- leave the client stuck on "running" forever,
- burn LALAL credits with no output.

Most short Benny clips finish in 20–60s, so this hasn't bitten yet. It **will** bite on longer scenes.

**Fix:** persist the LALAL job to `prek_redub_jobs` (already exists), cap in-function polling to ~90s, and if still processing return `{ status: "pending", jobId }`. Client re-invokes with `{ resumeJobId }` to continue polling. No credits wasted, no ghost states.

### 🟠 Moderate — Full Auto is fully serial across scenes

`runFullAuto` does `for (const s of scenes) await Promise.allSettled([redub, music])`. A 15-scene level with 45s per scene = 11+ minutes of thumb-twiddling. Redub + music for the *same* scene run in parallel (good), but scenes queue one at a time.

**Fix:** run 3 scenes concurrently with a small worker pool. LALAL and ElevenLabs both handle it; this cuts total time ~3×.

### 🟡 Minor — CORS import mismatch + R2 mirror silently fails

- `prek-clip-redub` still imports CORS from `npm:@supabase/supabase-js@2/cors`; `prek-clip-music-extract` uses `../_shared/cors.ts`. Same headers, but I claimed "unified" last turn — it isn't. Point both at `../_shared/cors.ts`.
- `mirrorToR2Async` calls `admin.functions.invoke("migrate-to-r2")` with no Authorization header. If that function verifies JWT, every mirror silently fails and files sit only in Supabase Storage (still playable, just no CDN offload). Pass the service-role JWT explicitly.

### Everything else I checked and it's fine

- `prek_level_audio_tracks` has `UNIQUE(level_id, track_index)` → no duplicate track race.
- Redub + music update disjoint JSON columns on `prek_levels` → concurrent updates safe.
- `music_audio_paths`, `music_generated_at`, `redub_isolated_paths`, `mute_source_video_audio` all exist.
- STS gets the isolated stem, not raw MP4 → redub track is clean vocals only. ✅
- LALAL back_track = full mix − vocals → music + SFX preserved. ✅
- `pause_on_word_card = false` for music, `= true` for redub → word cards duck the voice but keep the score playing. ✅

---

## Plan — three fixes, in this order

### 1. Resumable LALAL poll (critical)

**`supabase/functions/prek-clip-music-extract/index.ts`**
- Accept `resumeJobId?: string` in body. When present, skip upload/split and jump straight to polling that job.
- Cap in-function polling at `MAX_POLL_MS = 90_000` (well under edge wall-clock).
- After starting split, insert a row into `prek_redub_jobs` with `{ level_id, scene_key, kind: 'music', external_job_id: fileId, status: 'processing' }`.
- If poll times out with no `back_track` yet, return `{ status: "pending", jobId: fileId }` (HTTP 202). Don't error.
- On success, mark the job row `status: 'done'` and proceed with download/upload/DB merge as today.

**`src/hooks/useBennyRedub.ts` — `extractMusic`**
- If response has `status: "pending"`, wait 15s and re-invoke with `{ resumeJobId: jobId }`. Loop up to 10 minutes total on the client side. Update `musicStates[sceneKey]` with a "polling…" substate so the UI shows progress.

**`prek_redub_jobs`** already exists (checked in table list), so no migration needed — just verify columns fit (`kind`, `external_job_id`, `status`).

### 2. Concurrent Full Auto (moderate)

**`src/hooks/useBennyRedub.ts` — `runFullAuto`**
- Replace serial loop with a 3-worker pool:
  ```ts
  const CONCURRENCY = 3;
  const queue = [...scenes];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const s = queue.shift()!;
      await Promise.allSettled([redubScene(s), extractMusic(s)]);
      done += 1; setAutoProgress({ done, total: scenes.length });
    }
  });
  await Promise.all(workers);
  ```

### 3. Hygiene (minor)

- Change `prek-clip-redub` CORS import to `../_shared/cors.ts` (matches music-extract).
- In both functions, pass `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` when invoking `migrate-to-r2` so the mirror actually runs.
- Timestamp the isolated MP3 path (`-isolated-<ts>.mp3`) so regenerations don't collide with stale CDN caches.

### Technical notes

- No DB migration needed; `prek_redub_jobs` and every column referenced above already exist.
- No UI change beyond a "polling…" status string; existing status pills already handle the states.
- After edits, deploy `prek-clip-music-extract` + `prek-clip-redub` and hit **Full auto** on a real level to verify.

### Out of scope (deliberately)

- Splitting music into finer stems (vocals/drums/bass) — LALAL supports it, but you asked for "music + SFX minus voice" which is exactly `back_track`.
- Background job queue (pg-boss/inngest) — the resumable pattern above is enough; a real queue is overkill until you're batching hundreds of levels.