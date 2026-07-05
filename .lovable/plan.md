# Zero-egress at scale — brutally honest gap list

**TL;DR: You are ~80% there, not 95%. Serving via `cdn.yubilearn.com` alone does NOT guarantee zero egress. Cloudflare only makes R2 egress free when the response is a **cache HIT**. Every MISS still pulls from R2 to the edge — free from R2, but you burn Cloudflare Workers/CDN requests, and worse, at 100K concurrent viewers a cold POP can hammer R2 with origin fetches.**

Here is exactly what you have NOT done yet.

---

## 1. Cache-Control headers on uploads — MISSING (biggest gap)
`supabase/functions/migrate-to-r2/index.ts` line ~148 PUTs to R2 with only `Content-Type` and `Content-Length`. **No `Cache-Control` header.** Cloudflare's default cache TTL for a domain without explicit headers on media is short and inconsistent, and Cache Rules can be overridden by origin. Without this, cache HIT ratio at scale will be maybe 70–85%. You want 99%+.

**Fix:** add `"Cache-Control": "public, max-age=31536000, immutable"` to every R2 PUT. Videos, audio, avatars, campaign art never change (new versions get new keys), so 1-year immutable is safe.

Impact: cold new POP fetches drop by 10–30×. This is THE change that gets you to zero at 100K users.

## 2. Cloudflare Cache Rule for `cdn.yubilearn.com` — probably MISSING
Even with good origin headers, you want an explicit Cache Rule in the Cloudflare dashboard:
- Hostname = `cdn.yubilearn.com`
- Eligible for cache = **Yes**
- Edge TTL = **Override origin, 1 year**
- Browser TTL = **Respect origin**
- Cache by device type = No (videos are the same on all devices)

Without this, Cloudflare falls back to default cacheability which for `.mp4`/`.webm` is cached but for `.json`, `.vtt`, and some audio containers it is NOT by default.

## 3. Tiered Cache — probably OFF
Cloudflare → Caching → Tiered Cache → **Enable Smart Tiered Cache Topology**. Free feature. This routes cache misses through a single upper-tier POP before hitting R2, so a viral video only cold-fetches R2 once globally instead of once per edge POP (300+ locations). At 100K concurrent this is the difference between R2 seeing 1 request and 300.

## 4. Cloudflare Stream vs R2 for video — a real decision
R2 + Cloudflare CDN is fine for MP4 delivery to ≤ ~50K concurrent. Above that, or for adaptive bitrate / mobile networks, **Cloudflare Stream** ($5/1000 min stored + $1/1000 min delivered) is engineered for this exact case and delivers HLS/DASH with per-segment cache. For your pre-K short videos on classroom wifi, R2 + Cache Rules is enough. I'd only move to Stream if you hit real playback complaints. **Decision: stay on R2. Do NOT switch.**

## 5. Hotlink protection / referer restriction — MISSING
Right now anyone can `<video src="https://cdn.yubilearn.com/prek-level-videos/foo.mp4">` on their own site and burn your R2 traffic (still free) and your Cloudflare requests (metered on paid Workers plans). Add a Cloudflare **WAF Custom Rule**:
- If `hostname eq "cdn.yubilearn.com"` and `http.referer` does NOT contain `yubilearn.com` and NOT contain `lovable.app` and NOT empty (for direct video element loads on mobile Safari which sometimes strips referer) → **Managed Challenge or Block**.
- Test carefully — mobile Safari and some in-app browsers strip Referer, so allow empty referer for `Sec-Fetch-Site: same-origin` requests, or just allow empty referer and block only foreign referers. This is the safer setting.

## 6. Range request / video streaming settings — verify
Video `<video>` tags issue HTTP Range requests. Cloudflare caches range requests correctly by default only if the origin returns proper `Accept-Ranges: bytes` (R2 does) and consistent `ETag`. If Cache Rules override Cache-Control aggressively, ranges usually still work — but **turn ON "Cache Reserve"** if you're on Pro plan or higher (paid feature, $0.015/GB/month) for the pre-K videos specifically. On Free plan, skip Cache Reserve; Tiered Cache alone is enough.

## 7. CORS on the R2 bucket — verify explicitly
CORS is what lets `yubilearn.com` fetch cross-origin. Required config on `nabulearn-media` bucket:
```json
[{
  "AllowedOrigins": ["https://yubilearn.com","https://www.yubilearn.com","https://*.lovable.app","https://nabulearn.com"],
  "AllowedMethods": ["GET","HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag","Content-Length","Content-Range","Accept-Ranges"],
  "MaxAgeSeconds": 86400
}]
```
Missing `Content-Range` in `ExposeHeaders` breaks HTML5 video seeking in some browsers.

## 8. New uploads bypass R2 forever — DESIGN GAP
`src/lib/cdn.ts` has a HEAD-check fallback. Any file uploaded to Supabase Storage AFTER the initial migration serves from Supabase — **which is NOT free.** Supabase egress is metered.

**Two options:**
- **A) Trigger auto-migrate on upload** — add a Postgres trigger on `storage.objects` that queues `r2_migration_log` rows with status='pending' for the 6 R2-enabled buckets, and have the migrate function drain the queue on a schedule.
- **B) Manual "Migrate new files" button** in `/super-admin/r2` — you're 90% there; just needs a periodic click after adding pre-K content.

At 100K viewers watching brand-new pre-K videos before you've migrated them, you'd pay Supabase egress. Option A is the durable fix.

## 9. Rename `nabulearn-media` bucket — NO, don't
Already covered. Leaving it is correct.

## 10. Observability — MISSING
You have no way to see cache hit ratio. Add:
- Cloudflare → Analytics → Cache → filter by `cdn.yubilearn.com` — bookmark it.
- Set a Cloudflare **Notification** for cache hit ratio dropping below 95%.
No code required, ~2 min in dashboard.

---

## Priority order (do in this order)
1. **Add `Cache-Control: public, max-age=31536000, immutable` to migrate-to-r2 PUTs.** Requires code change + re-uploading existing files (or writing a one-time header-patch script that just re-PUTs metadata). ← this is the single biggest lever.
2. **Cloudflare Cache Rule for cdn.yubilearn.com — Edge TTL = 1 year, Cache = Eligible.** Dashboard, 2 min.
3. **Enable Smart Tiered Cache.** Dashboard, 30 sec.
4. **Verify CORS config on `nabulearn-media` R2 bucket** including `Content-Range` in ExposeHeaders.
5. **WAF rule for referer-based hotlink protection.** Dashboard, 5 min.
6. **Auto-migrate new uploads** (Option A trigger) OR commit to clicking "migrate" after every content upload (Option B).
7. **Bookmark cache analytics + set 95% hit-ratio alert.**

## What I would ship in code right now (with your approval)
- **Edit `supabase/functions/migrate-to-r2/index.ts`:** add `Cache-Control: public, max-age=31536000, immutable` and `Cache-Control` mirror to R2 PUT headers.
- **New edge function `r2-repatch-headers`:** super-admin only, walks `r2_migration_log` where `status='migrated'` and does a `PUT` copy-in-place with new metadata so existing objects get the header without re-downloading from Supabase. R2 supports this via `x-amz-metadata-directive: REPLACE` + copy source = same key.
- **Add a "Re-patch cache headers" button** to `/super-admin/r2`.
- **(Optional Option A)** — Postgres trigger on `storage.objects` INSERT that enqueues new files for migration. This is the biggest architectural add and I'd want to confirm before shipping.

## What only YOU can do (nobody can do this from code)
- Enable Smart Tiered Cache in Cloudflare dashboard.
- Add the Cache Rule for `cdn.yubilearn.com`.
- Set/verify CORS on the R2 bucket.
- Add the WAF referer rule.
- Bookmark analytics + set alert.

**Estimated total: 15 min in Cloudflare + one code deploy + one "re-patch headers" click.**

Say ship and I'll do items 1–3 of "what I would ship in code right now." Say ship plus Option A and I'll add the auto-migrate trigger too (that one needs a DB migration).
