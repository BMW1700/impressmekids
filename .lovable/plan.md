## Fixes I'll implement after approval

### 1. Unblock password reset emails (root of "no reset email")
- Re-enable Lovable Emails for the project (currently disabled — that's why the last recovery email hit DLQ with `Emails disabled for this project`).
- Reconcile email infrastructure (queue processor + cron) so pending recovery messages drain.
- Redeploy `auth-email-hook`.
- Verify by triggering a recovery for `jacob10028@yahoo.com` and confirming a `sent` row appears in the send log.

### 2. Fix "Google login just bounces back to /auth" for new Google users like Jacob
Root cause: Jacob's Google identity (`jacob.besser0@gmail.com`) is a different email than his email/password account (`jacob10028@yahoo.com`), so Google creates a separate user with no profile/role yet, and the app's post-login routing sends any user missing profile/role back to `/auth`.

Fixes:
- On successful OAuth callback, if the user has no profile/role row yet, route them to the profile-setup / role-selection screen instead of `/auth`.
- Auto-create the minimal profile row on first Google sign-in (id, email, display name from Google metadata) so post-login routing has something to read.
- Add a diagnostic log line so any future "bounced back to /auth" case shows the exact reason (no profile / no role / wrong role) in the console.

### 3. Give Jacob a way in right now
- Add a one-time "resend password reset" action in the superadmin user list so you can trigger a recovery email for any user without waiting for the queue backlog.
- Show Jacob's email/password account and his Google account side-by-side in the superadmin user view, with an "Merge Google identity into email account" action for cases where a user signs up twice under different addresses.

### 4. R2 cost hardening (the only remaining cost risk)
- Add a Cloudflare edge-cache probe to the R2 health widget: fetch a known-good Pre-K video twice and report `cf-cache-status` (MISS then HIT is the pass signal). If it stays DYNAMIC/MISS, the widget shows a red banner telling you Cloudflare caching is not on and estimating the extra cost per 100K users.
- Add a "Sample 20 real DB video URLs" audit button on `/superadmin/r2-migration` that HEADs each URL through `cdn.yubilearn.com` and reports pass/fail counts. This is the honest end-to-end check.
- No code path change is needed for R2 itself — it's already serving 200s for every real file in the database.

### 5. What still needs you (I can't do these from code)
- In Cloudflare: set the `cdn` CNAME to **Proxied (orange cloud)** and add a Cache Rule that caches everything under `cdn.yubilearn.com/*` (Edge TTL: respect origin — the files already carry the 1-year immutable header). Without this, R2 still works but you lose Cloudflare's free edge cache and pay slightly more in R2 Class B ops at scale.
- Confirm you want me to auto-create a profile on first Google sign-in (recommended) vs. show a signup-completion screen.

### Honest cost at scale (unchanged from earlier audit)
- Storage: pennies/month at current 1.5 GB total.
- Egress: R2 = free.
- Ops at 100K students × 20 video loads/day ≈ **~$22/month**. At 50 loads/day ≈ **~$55/month**.
- Same traffic on Supabase Storage egress would be roughly **~$1,800–2,400/month**.
- The one thing that would blow this up is Cloudflare not caching AND millions of unique fresh objects. Neither is your situation.