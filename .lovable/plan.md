
# Make Yubi Learn "perfect" on Cloudflare + R2

Three phases. Phase A is you clicking one button. Phase B and C are on me.

---

## Phase A — Reconnect the domain (you, ~2 min)

**In the Cloudflare Entri dialog you're looking at right now:**

1. Type `yubilearn.com` in the confirm box.
2. Click **Authorize and Delete conflicts**.
3. **Leave the proxy status as "DNS only" (grey cloud)** — do NOT flip to orange yet. Lovable's SSL cert needs this until Phase B step 3.

The record Entri is adding is identical to the one already there (`A yubilearn.com → 185.158.133.1`), so any "downtime" is seconds at most.

Then in Lovable → Project Settings → Domains, wait for `yubilearn.com` to flip back to **Active** (usually < 15 min).

---

## Phase B — R2 hardening (me, one build turn)

Three code changes that close the last gaps from the audit:

1. **Auto-copy new uploads to R2 for every public bucket, not just Pre-K.**
   Today only `uploadPreKVideo` mirrors to R2 on write. `world-backgrounds`, `campaign-assets`, `avatars`, `email-assets`, `prek-level-audio` rely on the HEAD-check fallback, which means new files silently serve from the backend at full egress cost. Fix: extend the existing Pre-K uploader pattern into a shared `mirrorToR2(bucket, path)` helper and call it from every public-bucket upload site. Failures are non-fatal (the fallback still works).

2. **CDN Health widget on `/superadmin/r2-migration`.**
   HEAD-pings the known-good Pre-K video via the actual `<video>` load path (browser HEAD to Cloudflare is CORS-blocked, so uses an `<img onerror>` probe on the poster instead). Green/red dot + last-checked timestamp. Also shows total bytes mirrored so far.

3. **Pinned note + "Resync now" button on the same page.**
   - Note explaining R2 never serves folder listings — a `/bucket-name/` 404 is expected, not a bug.
   - Button that re-runs the migration scan to catch any drift.

## Phase C — Move `aura-audio` to R2 with signed URLs (me, second build turn)

This is the big one and the reason your 100K-user number isn't already near zero. Student reading recordings are private (FERPA), so we can't just point them at a public CDN — they need short-lived signed URLs. R2 supports this natively.

Plan:

- Add `aura-audio` to `R2_ENABLED_BUCKETS` behind a second flag (`VITE_USE_R2_AURA=true`) so we can flip it independently.
- New edge function `sign-r2-audio-url` that mints a 15-min presigned R2 URL for a given `<uid>/<recording>` path, gated by the same RLS check as the existing signed-URL flow (student themselves, their teacher, their parent with consent).
- Update `useAuraRecordings` to call the new signer instead of `supabase.storage.createSignedUrl` when the flag is on.
- Mirror-on-upload: extend the Phase B helper to also copy `aura-audio` writes to R2.
- One-shot backfill: the existing R2 migration job already supports this; just add `aura-audio` to the bucket list and rerun.

Result: the `~$650/mo egress at 100K users` line goes to `$0`. Signed URLs cost fractions of a cent per million.

## Technical details

- No DB schema changes required. R2 credentials already live in edge function secrets from the original migration.
- The mirror helper writes to R2 via the existing `migrate-to-r2` edge function's `copy` action so we don't duplicate S3 client code in the browser.
- Signed URL TTL: 15 min matches the current `aura-audio` signed URL default; nothing else in the app assumes a longer link.
- No `index.html`, no `.env`, no `supabase/client.ts` edits. No new environment variables you have to set — I'll use the existing `VITE_USE_R2_CDN` flag pattern.

## What you'll need to do at the very end (optional, ~5 min)

Once Phase B + C are live and stable for 24h, if you want Cloudflare's WAF/DDoS/Bot Fight in front of the whole site (per your `PHASE_2_CLOUDFLARE_SETUP_GUIDE.md`):

1. Lovable → Project Settings → Domains → `yubilearn.com` → Advanced → check **"Domain uses Cloudflare or a similar proxy"**.
2. Then in Cloudflare, flip the grey cloud on the `A` record to orange.
3. In Cloudflare SSL/TLS: set to **Full (strict)**, enable **Always Use HTTPS**.

I can't do those three steps for you — they're outside Lovable — but I'll add a checklist to `/superadmin/r2-migration` so it's obvious what's left.

---

**Approve this and I'll execute Phase B, then Phase C in the next turn.**
