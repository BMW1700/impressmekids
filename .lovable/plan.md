## R2 Migration Pipeline

R2 credentials are now stored. Building the migration in 4 phases.

### Phase 1 — Migration tracking table
New `r2_migration_log` table records every file's status: `bucket`, `path`, `size`, `status` (pending/copied/failed/verified), `r2_key`, `error`, timestamps. Lets us resume if interrupted and audit progress.

### Phase 2 — Edge function: `migrate-to-r2`
Deno function that:
- Lists all files in every Supabase Storage bucket
- Streams each file from Supabase → uploads to R2 (`nabulearn-media`) via S3 PUT with SigV4
- Preserves paths: `pre-k-videos/benny/intro.mp4` → same path in R2
- Batches 25 files per invocation to avoid CPU timeout
- Logs every result to `r2_migration_log`
- Idempotent: skips files already marked `verified`

Only super_admin can invoke (JWT role check).

### Phase 3 — CDN URL resolver
New helper `src/lib/cdn.ts`:
```ts
getCdnUrl(bucket, path) => `https://cdn.nabulearn.com/${bucket}/${path}`
```
Flip **public** buckets over first (Benny videos, story audio, avatars, level thumbnails). Private/signed-URL buckets (assignment images) stay on Supabase for now — they're 5% of egress and need a separate signing setup.

Feature-flagged with `VITE_USE_R2_CDN` so we can toggle instantly if something breaks.

### Phase 4 — Admin migration console
Simple page at `/super-admin/r2-migration` with:
- "Start migration" button (calls edge function in a loop until done)
- Live progress bar reading from `r2_migration_log`
- Failed-files list with retry
- Toggle to flip `VITE_USE_R2_CDN` on/off

### After migration
1. Spot-check 5 CDN URLs load from `cdn.nabulearn.com`
2. Flip flag on → monitor for 24h
3. Egress bill drops from ~$17k → ~$15/mo (R2 storage only, zero egress)
4. Later: repeat for signed-URL buckets with a signer edge function

**Order of execution:** migration table → edge function → resolver + flag → admin console → run migration.

Approve and I'll start with the migration.