# R2 Cost Audit — Brutal Honest Findings

## The truth about what's on R2 right now

Your existing R2 setup has an **auto-mirror-on-upload** helper (`src/lib/r2Mirror.ts`) plus a **HEAD-check fallback** on read (`src/lib/cdn.ts`). The fallback silently patches anything that misses the mirror — so nothing is *broken*, but every missed file costs Supabase egress on every read until a full re-migration scan is run.

I audited every `storage.upload()` call site. Here's the score:

| Call site | Bucket | Auto-mirrors to R2? |
|---|---|---|
| `preKAudioUpload.ts` (admin audio tracks) | `prek-level-audio` | ✅ Yes |
| `AccountSection.tsx` (avatars) | `avatars` | ✅ Yes |
| `CampaignModeEntry.tsx` (campaign art) | `campaign-assets` | ✅ Yes |
| **`preKVideoUpload.ts` (Benny videos)** | `prek-level-videos` | ❌ **NO** |
| **`prek-clip-redub` edge fn (redub MP3s)** | `prek-level-audio` | ❌ **NO** |
| **`prek-word-tts` edge fn (Benny word audio)** | `prek-word-tts` | ❌ **NO** — bucket isn't even in the R2 allowlist |

**Translation:** the three highest-volume things you're about to generate — new Benny videos, ElevenLabs redubs, and every pre-warmed word MP3 — are currently going to Supabase Storage only. They *work* (HEAD fallback), but you pay Supabase egress on every child playback forever. That's the exact opposite of what you want at 100K users.

## What I'll fix (one build turn)

### 1. Auto-mirror the 3 gaps
- `preKVideoUpload.ts` → add `mirrorToR2Async('prek-level-videos', path, …)` after upload.
- `prek-clip-redub/index.ts` → invoke `migrate-to-r2` `copy-path` after each MP3 upload (edge fn can't import client helper).
- `prek-word-tts/index.ts` → same, plus **add `prek-word-tts` to `R2_MIRRORED_BUCKETS` and `R2_ENABLED_BUCKETS`** so word-audio serves from `cdn.yubilearn.com` instead of signed Supabase URLs. Bucket becomes public (word pronunciations, no PII — same trust level as `prek-level-audio`).

### 2. Backfill anything already in Supabase-only
Run the existing **Super Admin → R2 Migration** tool once (Scan → Run). This walks every bucket, copies missed files to R2, and stamps cache headers. Zero code needed — the tool already exists. I'll add a note on the R2 Migration page telling you to re-run it after every big content push (or I can add a cron that runs it nightly — your call).

### 3. Verify
Post-fix, upload one test video + trigger one redub + prewarm one word, then confirm all three land at `cdn.yubilearn.com/<bucket>/<path>` with HTTP 200.

## Cost math (brutally honest)

Assumptions: avg Pre-K session = 5 videos (~15 MB each) + 20 word plays (~30 KB each) + 3 redub tracks (~200 KB). ≈ **76 MB egress per session**. Assume 20 sessions/user/month.

| Users | Monthly egress | Supabase cost (@$0.09/GB) | R2 cost (@$0/GB egress) |
|---|---|---|---|
| 10,000 | ~15 TB | **~$1,350/mo** | **$0** |
| 100,000 | ~150 TB | **~$13,500/mo** | **$0** |

R2 storage itself is $0.015/GB/mo. Even at 500 GB of total video library that's **$7.50/mo storage, $0 egress**. Your only ongoing Cloudflare bill for media at 100K users is roughly **$10–20/month total**, vs. **$13.5K/month** if we leave the gaps open.

Private student audio (`aura-audio`) already mints R2 presigned URLs via `sign-r2-audio-url` — that path is already free-egress and FERPA-clean. No change needed.

## Answer to your direct questions

- **"Is all new stuff automatically stored in R2?"** — Right now: only the 3 rows marked ✅. After this fix: **yes, everything.**
- **"Do I have to do it manually?"** — No. Mirror-on-upload is invisible. For pre-existing files, one click on Super Admin → R2 Migration → Scan/Run.
- **"Can you just do it for me?"** — Yes, that's what this plan does.

## Technical details
- Edge-function mirror uses `supabase.functions.invoke("migrate-to-r2", { action: "copy-path", bucket, path, contentType, size })` — same path as the client helper, no new infra.
- Making `prek-word-tts` public: `supabase--storage_update_bucket(name="prek-word-tts", public=true)`. Client switches from `createSignedUrl` to `getPublicUrl` + `rewriteToCdn`. Existing cached MP3s keep working (signed URLs still valid until TTL expires; new reads use CDN).
- All mirror calls are fire-and-forget; a mirror failure never blocks the upload — HEAD fallback still catches it.
