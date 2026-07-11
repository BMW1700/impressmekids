# Why the numbers lie, and how we finish the R2 cutover

## What you're actually seeing in your two screenshots

**Pic 1 (mid-run):** 832 / 1000 copied, 73 failed. All 73 are `prek-word-tts/*` files.
**Pic 2 (after "Run migration"):** 1000 / 1000 copied, Failed **0** — but the "Failed files" list still shows 50 rows of `R2 PUT 403 AccessDenied`.

That is not a display glitch. There are three separate bugs stacked on top of each other, and one Cloudflare setting.

---

## Bug 1 — The counters cap at 1000 rows (silent truncation)

`migrate-to-r2` / `stats` runs:
```
admin.from("r2_migration_log").select("status")
```
PostgREST caps that at **1000 rows by default**. You have more than 1000 files in Storage (Pre-K videos alone + word TTS + audio mix + avatars easily exceeds it), so:

- `total` is clamped to 1000.
- Every row past #1000 is invisible to the counter — including all the failed `prek-word-tts` rows.
- That's why the top card says "1000 / 1000 (100%)" and "Failed: 0" while the Failed list underneath still shows 50 real 403s.

You are **not** actually done. You just can't see the rest.

## Bug 2 — Repatch failures never change `status`

`repatchHeadersBatch` writes `error: "repatch: ..."` on failure but leaves `status='copied'`. So repatch 403s are completely invisible to both the counters and the Failed list (which filters `status='failed'`).

## Bug 3 — Retry loop dies at 5 attempts, with no UI reset

`migrateBatch` filters `.lt("attempts", 5)`. Once a file has failed 5 times (which the `prek-word-tts` rows have, from earlier token-permission runs), clicking "Run migration" quietly skips them forever. No button resets attempts.

## The Cloudflare cause behind the 403s

Every failing row is `R2 PUT 403 AccessDenied`. That is 100% a Cloudflare R2 API token scope problem — not code. Two things must be true on the token stored as `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`:

1. **Permission**: `Object Read & Write` (not "Read only", not "Admin Read only").
2. **Scope**: `Apply to all buckets in this account` — OR explicitly include `yubilearn-media`. If the token was minted scoped to a different bucket name, every PUT to `yubilearn-media` 403s.

There is no code fix for #1/#2. You regenerate the token in Cloudflare and paste it into the two secrets. I'll walk you through it below.

---

## The plan

### Part A — Fix the migration tool so it tells the truth

**`supabase/functions/migrate-to-r2/index.ts`**
1. Rewrite the `stats` action to use real Postgres counts (one `head:true, count:exact` query per status: pending / copied / failed) instead of `.select("status")`. Removes the 1000-row cap. Add a `repatchFailed` count = rows where `status='copied'` AND `error ILIKE 'repatch:%'`.
2. Add a new action `reset-failed`: sets `status='pending'`, `attempts=0`, `error=null` on every `failed` row so the retry loop picks them up again after you fix the R2 token.
3. Add a new action `list-failed` that returns both categories (transfer-failed + repatch-failed) with real pagination — not the current 50-row `.limit(50)` client query.

**`src/pages/superadmin/R2Migration.tsx`**
1. Show the real totals from the new `stats` shape. Add a fourth stat: **Repatch failed**.
2. Replace the client-side `.from('r2_migration_log').select(...).limit(50)` with the new `list-failed` action so the list matches the counters.
3. Add a **"Reset failed → retry"** button next to "Run migration" that calls `reset-failed` then loops `batch` until done. This is the button you press after fixing the Cloudflare token.
4. Small copy fix on the progress card: show `total` as "known files" and label the bar so 100% means "of files scanned", not "of everything in Storage" (only meaningful after a fresh scan).

### Part B — Cloudflare token walkthrough (you do this, 90 seconds)

1. Cloudflare dashboard → **R2** → **Manage R2 API Tokens** → **Create API Token**.
2. Permissions: **Object Read & Write**.
3. Specify bucket: **Apply to all buckets in this account** (safest) OR pick `yubilearn-media` explicitly.
4. TTL: Forever. Client IP filtering: none.
5. Copy the **Access Key ID** and **Secret Access Key**.
6. In Lovable, update secrets `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` with the new values (I'll open the secure form for both).
7. Edge functions pick the new secrets up automatically on next invocation.

### Part C — The finish sequence (after Part A ships + Part B is done)

On the R2 Migration page:
1. **1. Scan Storage** — re-scans every bucket so the log matches reality (this is what makes `total` truthful again).
2. **Reset failed → retry** — new button. Retries every failed row with the new token.
3. **2. Run migration** — drains any remaining pending rows.
4. **3. Re-patch cache headers** — safe to run last; only touches already-copied rows to guarantee the 1-year immutable cache header is set (this is what makes egress ≈ $0 at scale).

At the end you should see: `Pending 0 / Failed 0 / Repatch failed 0`, and the failed-files section empty.

## Technical notes

- The 1000-row PostgREST cap also affected `discovered` in the scan status but not fatally — `scanInBackground` writes rows in 500-row upserts and increments its own counter, so scans past 1000 files were fine. Only the reporting endpoint lied.
- `mirrorToR2` (fire-and-forget on upload) will keep succeeding on new writes once the token is fixed — no code change needed there.
- `prek-word-tts` and `aura-audio` remain **private buckets**; R2 copies are read via signed URLs from `sign-r2-audio-url` and `prek-word-tts`. This is intentional (FERPA / student audio). CDN `cdn.yubilearn.com` only serves the public buckets.
- No database migration required — `r2_migration_log` and `r2_migration_status` schemas are untouched.

## Files touched

- `supabase/functions/migrate-to-r2/index.ts` — new `stats` shape, new `reset-failed` and `list-failed` actions.
- `src/pages/superadmin/R2Migration.tsx` — new stat tile, new retry button, use new list endpoint.

Nothing else. No schema changes, no bucket changes, no client-facing app changes.
