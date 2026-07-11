
## Brutally honest breakdown

**Yes, the migration worked. 99% is real.** I audited the backend directly. Here is exactly what's happening.

### What the numbers actually mean

- **1,512 files copied** into Cloudflare R2 (~1.67 GB). Verified in the `r2_migration_log` table.
- **Every single active bucket is at 100% copied, 0 failed, 0 repatch failed** — prek-level-audio, world-backgrounds, campaign-assets, avatars, email-assets, aura-audio, prek-word-tts. All green.
- **The only 19 "failed" rows are all in `prek-level-videos`, and they are all ghosts.** I checked each of the 19 paths against Supabase Storage: **none of them exist in Storage anymore.** I also checked whether any `prek_level_words` row still references them: **zero references.**
- Translation: these 19 rows are stale log entries for videos that were deleted (old scratch uploads / rebrand cleanup). There is nothing to migrate because the source files don't exist. They will never copy no matter how many times you retry — retry keeps re-downloading a file that isn't there and re-logging "Object not found."

### Egress / cost answer

- **Yes, your egress will be effectively zero.** Every file the app currently serves for Pre-K videos, Pre-K audio, world backgrounds, campaign assets, avatars, email assets, aura audio, and Benny TTS is in R2 and served through `cdn.yubilearn.com`. Cloudflare R2 egress is $0.
- **At 100K+ users your storage bill stays tiny.** R2 storage is $0.015/GB/month. You have ~1.67 GB migrated. Even 100x that is ~$2.50/month for storage. Class-A ops (writes) are $4.50/million and only happen on new uploads. Class-B ops (reads) are $0.36/million and are cheap even at massive read volume.
- The only remaining variable cost that scales with users is **new** uploads to Storage (they hit R2 via the `mirrorToR2` helper on write — already wired in). Reads stay free.

### What to do about the 19

Do **not** click "Reset failed → retry" again. It will fail again for the same reason. The correct move is to **delete the 19 orphaned log rows** so the dashboard shows a clean 0.

## Plan

1. Add a new backend action `purge-orphaned-failed` to `supabase/functions/migrate-to-r2/index.ts` that:
   - Finds rows where `status='failed'` AND `error LIKE '%Object not found%'`
   - For each row, verifies the object is genuinely absent from Storage (HEAD check via service role) as a safety net
   - Deletes only those rows from `r2_migration_log`
   - Returns `{ purged: N, kept: M }` so the UI can report exactly what happened

2. Add a UI button on `src/pages/superadmin/R2Migration.tsx` labeled **"Purge ghost failures (19)"** — only visible when Failed > 0, with helper text:
   > "These log rows point to files that were deleted from Storage before migration ran. They can't be copied because the source no longer exists. Safe to remove."

3. Re-run **1. Scan Storage** afterward to confirm the dashboard reads **Pending: 0, Failed: 0, Repatch failed: 0** across the board.

4. Leave a short note on the page: **"Migration complete. All actively-referenced files are in R2. Egress costs = $0."**

### Not in scope

- No changes to the migration copy logic (it works — proven by 1,512 successful copies).
- No changes to R2 credentials/token (the permission test is green).
- No touching the `mirrorToR2` on-upload helper (it's the right long-term design).
