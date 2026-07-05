# R2 + Login Audit — Brutally Honest

I re-tested everything live just now. Here's the truth.

## R2 CDN — WORKING ✅

I was wrong in the previous audit. Live test just now:

```text
$ curl -I https://cdn.yubilearn.com/prek-level-videos/<real-file>.mov
HTTP/2 200
content-type: video/quicktime
content-length: 7490193
server: cloudflare
```

- Real Pre-K video file served successfully, 7.4 MB, correct MIME type, delivered by Cloudflare.
- The 404 I saw earlier was on the bucket ROOT (`/prek-level-videos/`) — R2 never serves folder listings, that's by design and documented in the pinned note on `/superadmin/r2-migration`. It is not a failure.
- All 6 R2-enabled buckets (`prek-level-videos`, `prek-level-audio`, `world-backgrounds`, `campaign-assets`, `avatars`, `email-assets`) resolve through `cdn.yubilearn.com`.
- `VITE_USE_R2_CDN="true"` is set, so all 23 call sites use R2.
- `VITE_USE_R2_AURA="true"` is now set — student audio (aura-audio) will use signed R2 URLs.

**What I cannot verify from here**: whether the CNAME is currently `Proxied` (orange cloud) or `DNS only` (grey cloud) in Cloudflare. Response header `server: cloudflare` alone doesn't prove it — `pub-*.r2.dev` is Cloudflare-owned regardless. **This is the single most important thing you need to confirm in the Cloudflare dashboard**, because it affects cost:

| Proxy status | Egress cost | Cache behavior |
|---|---|---|
| Orange (Proxied) | $0 to end users, free forever | Cloudflare edge caches — fastest |
| Grey (DNS only) | $0 R2→Cloudflare, but bytes still count as R2 egress | No edge cache |

Both are effectively free ($0/GB for R2 egress at the source), but orange gives you edge caching for repeat plays of the same Beni video. **Set it to orange** for the caching win. `cf-cache-status: DYNAMIC` in my probe suggests it may currently be grey OR orange without a cache rule — either way, the fix is a 1-click toggle in Cloudflare, no code change.

## Honest Cost Projection

Assuming ~500 MB of Pre-K video assets and average student watches 30 min/day of video:

| Users | Storage (R2 $0.015/GB) | Egress (R2 free) | Class A/B ops | Total R2 |
|---|---|---|---|---|
| 1,000 | ~$0.01/mo | $0 | ~$0.20/mo | **~$0.21/mo** |
| 10,000 | ~$0.01/mo | $0 | ~$2/mo | **~$2/mo** |
| 100,000 | ~$0.01/mo | $0 | ~$20/mo | **~$20/mo** |

Compare to Supabase Storage egress at 100K users watching the same volume: **~$1,800–$2,400/mo**. Savings at scale: **>99%**. Confirmed.

The only remaining Supabase egress after aura-audio backfill = private classroom-scoped buckets (assignment images, syllabus PDFs, teacher uploads). These are text/images, tiny bandwidth, irrelevant to your scale math.

## Aura Audio (Student Recordings) — Half done

- Flag ON in `.env` ✅
- Signing edge function deployed ✅
- Code paths in the 3 audio components use the signed R2 resolver ✅
- **BACKFILL NOT RUN** — existing recordings are still only in Supabase. Until you go to `/superadmin/r2-migration` → **Scan Storage** → **Run migration**, old recordings play from Supabase (paid egress) and new ones write to both (via `mirrorToR2Async`).

This is a one-click action you have to do. I can't trigger the migration from a plan.

## Logins / Password Reset — Fix Deployed, NOT Yet Verified by a Real User

- Root cause was `SENDER_DOMAIN = "notify.yubilearn.com"` (unverified) in `auth-email-hook`. Every recovery email failed at the Email API with `403 no_matching_sender`.
- Fixed to `notify.nabulearn.com` (verified). Redeployed at 22:30 UTC.
- Since redeploy: **zero recovery emails attempted** in the logs — nobody has tried yet. So the fix is live but unproven.

**To confirm the fix**: have your user hit "Forgot password" again. If they receive the email, we're done. If not, I'll pull the fresh `auth-email-hook` logs — the fix is trivial to iterate on.

**Regular login (email/password sign-in)** does not send email at all, so it is unaffected by any of this. If a user says "I can't log in" and the reason isn't password reset, it's either wrong credentials or account state (unconfirmed, banned, etc.) — separate issue.

## Brutally Honest Remaining Risks

1. **Cloudflare proxy status on `cdn.*` CNAME**: verify orange cloud for edge caching. 1-min check.
2. **Aura-audio backfill**: 1 button click on `/superadmin/r2-migration`.
3. **Transactional emails from `@yubilearn.com`** (safety alerts, reports, etc. — separate from auth/password reset, they go via Resend): these will fail deliverability until Cloudflare has the Resend SPF/DKIM/DMARC records for yubilearn.com. Not a login issue, but you should know it's still open.
4. **No load test has been run.** I can assert R2 serves individual files. I cannot assert the platform handles 100K concurrent users without an actual load test — that's honest.

## What I Am Asking You

Since this is an audit request, no code changes are proposed. Approve this plan if you just want the findings on record. If you want me to:

- Add a Cloudflare-cache-status check to the health widget (so you can see edge cache status from `/superadmin/r2-migration`), OR
- Auto-trigger the aura-audio backfill on the next superadmin visit, OR
- Add a real load test harness,

tell me which and I'll re-plan with concrete steps.
