# Brutally honest audit — email + R2

## TL;DR

- **R2 is currently BROKEN in production.** `cdn.yubilearn.com` returns HTTP 404 from Cloudflare on every asset. When you moved yubilearn.com's nameservers to Cloudflare, the old CNAME that pointed `cdn.yubilearn.com` at the R2 public bucket **did not come with it**. Right now the platform is paying full Supabase egress on everything.
- **Resend does NOT need to be "re-set up."** Your Resend account, API key, and code are fine. What's missing is the **SPF / DKIM / MX / DMARC DNS records for yubilearn.com** in the new Cloudflare zone. Those records lived at your old DNS provider and were not copied over. That is why your user's password-reset / transactional emails aren't arriving.
- **Auth password-reset emails** go through Lovable Emails on `notify.nabulearn.com` (a different root domain — unaffected by the yubilearn.com nameserver change). If your user still isn't getting Supabase password-reset mail, it's spam / suppression / stale redirect URL, not a domain issue.
- **aura-audio R2** (Phase C code) is deployed but **dormant** — `VITE_USE_R2_AURA` isn't in `.env`, and the backfill hasn't been run.

## Evidence

```text
$ curl -sI https://cdn.yubilearn.com/prek-level-videos/1/video.mp4
HTTP/2 404
server: cloudflare
cf-cache-status: DYNAMIC
```

- `.env` has `VITE_USE_R2_CDN="true"` → all rewrite paths try the CDN first.
- 23 call sites use `getCdnUrl` / `rewriteToCdn` / `resolveCdnOrFallback`. Roughly half go through `resolveCdnOrFallback` (HEAD-probe, falls back to Supabase — user sees content, you pay egress). The other half return the R2 URL directly (Pre-K videos, campaign assets, avatar upload path) — those are currently **404-ing the user**.
- `notify.nabulearn.com` email domain: verified, auth-email hook active. Unrelated to yubilearn.com DNS change.
- `send-*` edge functions send from `noreply@yubilearn.com`, `alerts@yubilearn.com`, `safety@yubilearn.com`, etc. — all on the yubilearn.com root, which now has a fresh empty Cloudflare zone with no Resend records.

## Cost picture, honestly

- **Now (broken):** paying Supabase egress on 100% of assets that fall back, and serving 404s on the rest. Worst of both worlds.
- **After the fix below, at scale:** Pre-K video + backgrounds + campaign assets + avatars + email assets served from Cloudflare R2 with $0 egress. At 100K users the projected media egress bill collapses from ~$1.5-2K/mo (Supabase) to ~$0 (R2 egress free) + storage (~$15/mo for ~1TB) + Class A/B ops (pennies).
- **aura-audio** still on Supabase until Phase C is switched on = ~$650/mo audio egress at 100K users. The switch is a one-liner + backfill (below).

## Fix plan

### Phase 1 — Restore R2 CDN (fixes the actual broken thing)

Add these DNS records at Cloudflare for `yubilearn.com`:

```text
Type   Name  Target                                              Proxy
CNAME  cdn   pub-<your-r2-bucket-hash>.r2.dev                    Proxied (orange)
```

Exact target = the `pub-*.r2.dev` hostname of your R2 public bucket (visible in Cloudflare → R2 → your bucket → Settings → Public Access). Proxy status **must be orange** so Cloudflare's free egress applies.

Verify with:
```text
curl -I https://cdn.yubilearn.com/prek-level-videos/<known-path>.mp4  → HTTP 200
```

No code changes required — as soon as the CNAME resolves, all 23 call sites work again.

### Phase 2 — Restore email deliverability on yubilearn.com

Add these DNS records at Cloudflare for `yubilearn.com` (values come from Resend dashboard → Domains → yubilearn.com; do **not** guess — copy them verbatim):

```text
Type   Name              Value                                Proxy
TXT    send              "v=spf1 include:amazonses.com ~all"  DNS only
TXT    resend._domainkey <DKIM public key from Resend>        DNS only
MX     send              feedback-smtp.us-east-1.amazonses.com  (priority 10)  DNS only
TXT    _dmarc            "v=DMARC1; p=none;"                  DNS only
```

Then in Resend → Domains → yubilearn.com click **Verify**. All 12 `send-*` edge functions start delivering again.

**Password reset for your specific user:** once DNS is verified, ask them to (a) check spam, (b) confirm the email is not on Resend's suppression list, (c) if it still fails, use Supabase Auth reset (goes via `notify.nabulearn.com`, unaffected). No code change needed.

### Phase 3 — Turn on aura-audio R2 (kill the last egress line)

1. Add to `.env`: `VITE_USE_R2_AURA="true"`
2. Go to `/superadmin/r2-migration` → **Scan Storage** → confirm `aura-audio` appears → **Run migration**.
3. Republish so the flag ships.

After this, the only Supabase egress left is private classroom-scoped buckets, which are tiny and irrelevant to your scale math.

### Phase 4 — Add a self-check so this can't silently break again

Extend the existing `CdnHealthWidget` on `/superadmin/r2-migration` to also HEAD-probe `cdn.yubilearn.com/prek-level-videos/<known-key>` on load and show a red banner site-wide (superadmin only) if it 404s. Prevents another silent regression the next time DNS moves.

## What I am NOT doing

- Not touching Resend code / API key / client wrapper — they're fine.
- Not disabling Lovable Emails on `notify.nabulearn.com` — that's the auth-email path and it still works.
- No schema, RLS, or auth changes.
- No changes to `src/integrations/supabase/client.ts` or `.env` auto-managed keys.

## Your action items vs mine

- **You (Cloudflare dashboard):** add the `cdn` CNAME (Phase 1) and the four Resend records (Phase 2). I cannot touch external DNS.
- **Me (next build turn):** Phase 3 flag + Phase 4 health widget expansion. ~10 min of build work, no risk.
