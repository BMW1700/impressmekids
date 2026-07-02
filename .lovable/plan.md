## Current state (honest)

- 1000 files copied to R2. 0 failed. ✅
- App is **still** serving media from Supabase Storage. ❌
- Egress cost reduction so far: **$0**.

The migration copied the files. It did not cut over. Those are two different things.

## Plan: actually cut over so costs drop

### Step 1 — Verify R2 objects are publicly reachable

Pick 3 known files (e.g. a Benny intro video, a hero image, an audio clip). Open each in the browser at:

```
https://cdn.nabulearn.com/<bucket>/<path>
```

If they load: green light.
If they 403/404: fix `cdn.nabulearn.com` custom-domain binding before proceeding. Do NOT flip the flag on a broken CDN — the app will break for every user.

### Step 2 — Identify which buckets are safe to flip

Query `r2_migration_log` grouped by bucket to see exactly which buckets have copies in R2. Then classify:

- **Public buckets** (Benny videos, world backgrounds, hero images, story audio, avatars) → safe to flip.
- **Private/signed-URL buckets** (assignment question images, private uploads, anything path-scoped to `<classroom_id>/...`) → stay on Supabase for now. These are ~5% of egress and need a separate signer function.

I will list the buckets and mark each one before we touch code.

### Step 3 — Enable R2 for public buckets only

Edit `src/lib/cdn.ts`:

```ts
const R2_ENABLED_BUCKETS = new Set<string>([
  "pre-k-videos",
  "world-backgrounds",
  "story-audio",
  "avatars",
  // ...only the ones confirmed public + copied
]);
```

And add `VITE_USE_R2_CDN=true` to `.env`.

### Step 4 — Publish and verify with the Network tab

Publish the frontend. Then open the app, load a Pre-K level, and check the browser Network tab:

- Media requests should go to `cdn.nabulearn.com` ✅
- Media requests should NOT go to `*.supabase.co/storage/...` ❌

If any request still hits Supabase, that specific code path is bypassing `getCdnUrl()` and needs to be patched.

### Step 5 — Monitor for 24 hours

- Watch for broken images/videos in Sentry.
- Watch backend egress metrics drop.
- Keep the flag reversible: flipping `VITE_USE_R2_CDN=false` and republishing instantly restores Supabase serving.

### Step 6 — Later (not today): private buckets

Build a small signer edge function that returns time-limited R2 signed URLs for the private buckets (assignment images, etc.). Migrate those, then flip. This closes the last ~5% of egress.

## What I can promise after this plan runs

- **After Step 4**: I can confirm from the Network tab whether media is served from R2. That's the only actual proof.
- **After ~48h of monitoring**: I can confirm the backend egress line item dropped in the usage metrics.

Anyone (including me) claiming "costs are down 100% guaranteed" before Step 4 is bullshitting you.

## Approve this and I'll execute Steps 1–4 back to back.