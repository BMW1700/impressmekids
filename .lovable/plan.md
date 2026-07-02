# Back to Scale + Cost Plan — What We Do Tonight

Recap of where we landed before the teacher-login detour:

- Your **real** cost driver at 100k users is **network egress** (video streaming), not database or storage.
- Benny videos in storage cost **~$0.05/mo** — not the problem.
- Migrating off Lovable Cloud to standalone Supabase **only saves ~$500–$1,500/mo** at 100k scale, and risks breaking Clever SSO + Google OAuth 2 weeks before launch.
- **Cloudflare on your own account** is the single highest-ROI move: kills 80–95% of egress and drops projected 100k-user bill from **$17k–$32k/mo → $2k–$4k/mo**.
- Jacob's signup failure = Supabase Auth default rate limit (2 signups/hr per IP). Trivial to raise.

## The Plan (tonight, ~90 min, no code migration, no risk to Clever/Google)

### Step 1 — Fix the signup rate limit (10 min)
Raise the auth signup rate limit from the default 2/hr per IP to something realistic for a daycare / classroom (30 signups/hr per IP). This is a config change on your backend auth settings — not a code change, not a migration. No downtime. Jacob and future interns/teachers can create accounts.

### Step 2 — Set up your own Cloudflare account (30 min)
1. Create free Cloudflare account (use your business email — same one as your domain registrar login).
2. Add `nabulearn.com` as a site (Free plan is fine to start).
3. Cloudflare will scan your existing DNS and show 2 nameservers to copy.
4. Log into your **domain registrar** (where you bought `nabulearn.com`) and replace the nameservers with Cloudflare's.
5. Wait 15–60 min for propagation.

### Step 3 — Configure the egress-killer cache rules (20 min)
Once Cloudflare is active:
- SSL/TLS → **Full (strict)** + Always Use HTTPS.
- Caching → Create a **Cache Rule**: for `*.mp4`, `*.webm`, `*.png`, `*.jpg`, `*.webp`, `*.woff2` → **Cache Everything, Edge TTL 1 month**.
- Speed → enable Brotli + Auto Minify (JS/CSS/HTML).
- Security → enable Bot Fight Mode + WAF managed rules.

This is what actually stops the egress bleed. Benny videos will be served from Cloudflare's edge (free egress) instead of being re-downloaded from origin every play.

### Step 4 — Verify it's working (10 min)
- Load a Benny episode in an incognito window.
- Load it again.
- Second load's response headers should show `cf-cache-status: HIT`.
- If HIT → you're saving money on every subsequent view forever.

### Step 5 — Defer full Supabase migration (decision, 0 min)
Do NOT migrate before launch. Revisit in 4–8 weeks once you have real traffic data. If migration still makes sense then, we do it with a proper 2–3 day plan: parallel Supabase project, R2 for video, Clever/Google re-verification, DNS cutover — not a panicked 24-hour rush.

## Brutally honest cost math after tonight

| Users concurrent | Without CF (today) | With your CF (after tonight) |
|---|---|---|
| 5k | ~$150/mo | ~$60/mo |
| 25k | ~$2,500/mo | ~$400/mo |
| 100k | $17k–$32k/mo | **$2k–$4k/mo** |

Cloudflare is the difference between a viable business and one that dies of egress at 30k users.

## What I need from you to start

1. **Where did you buy `nabulearn.com`?** (GoDaddy / Namecheap / Google Domains / Squarespace / other) — so I can give you exact nameserver-change screenshots.
2. **Do you already have a Cloudflare account** from a past project, or do we make a fresh one?
3. Confirm you want me to raise the signup rate limit **right now** so Jacob can make his account.

Once you answer those three, I switch to build mode and execute Step 1 immediately, then walk you through Steps 2–4 click-by-click.