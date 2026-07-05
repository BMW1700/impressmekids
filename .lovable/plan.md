# R2 status + super-admin blocker toggle

## Part 1 — R2 audit: brutally honest

**Short version: R2 is already working. There's ~5 min of DNS/cosmetic follow-up, no code work required to serve traffic.**

### What's already done (verified)
- `src/lib/cdn.ts` → `CDN_BASE = "https://cdn.yubilearn.com"` (already switched off nabulearn)
- Code comment states verified 2026-07-02: `cdn.yubilearn.com` returns HTTP 200 with correct content-type
- `.env` has `VITE_USE_R2_CDN="true"` — flag is on
- 6 buckets flagged R2-enabled: `prek-level-videos`, `prek-level-audio`, `world-backgrounds`, `campaign-assets`, `avatars`, `email-assets`
- HEAD-check fallback in place — files not yet migrated silently fall back to Supabase Storage, so nothing breaks
- `migrate-to-r2` edge function is deployed, super-admin gated, and the migration UI at `/super-admin/r2` is live
- Private/FERPA buckets correctly excluded (aura-audio, assignment-question-images, etc.)

### What's NOT tied to the domain rename (zero work)
- The R2 bucket is named `nabulearn-media` in Cloudflare. **Do not rename it.** Bucket name is internal — never exposed to users. Renaming would break every existing object key. Leave it.
- Clever integration: no domain coupling. Zero work.
- Supabase Storage URLs: fallback path only, no domain rewrite needed.

### What you personally need to do (~5–15 min, all in Cloudflare dashboard)
1. **Confirm `cdn.yubilearn.com` custom domain is attached to the `nabulearn-media` R2 bucket** in Cloudflare → R2 → bucket → Settings → Custom Domains. If it says Active, you're done. The code comment says it's verified but double-check after the domain move.
2. **If yubilearn.com's DNS is not yet on Cloudflare nameservers**, R2 custom hostname won't work. Move nameservers (or at minimum delegate `cdn.yubilearn.com` via NS records) — same as you did for nabulearn.com.
3. **CORS on the R2 bucket** — must allow `https://yubilearn.com`, `https://www.yubilearn.com`, `https://*.lovable.app`, and keep `https://nabulearn.com` during the transition. Check Cloudflare → R2 → bucket → Settings → CORS Policy.
4. **Optional cleanup (do NOT do now):** eventually rename comment/log references from "nabulearn" to "yubilearn" in `migrate-to-r2/index.ts`. Cosmetic only, zero user impact.

### Real risks I'm not sugarcoating
- **If you move yubilearn.com's nameservers to Cloudflare and forget to re-add the Lovable A records** (`185.158.133.1` for `@` and `www`), the main site goes offline. Cloudflare doesn't import GoDaddy records automatically.
- **If cdn.yubilearn.com isn't Active in Cloudflare R2**, every pre-K video / world background will silently fall back to Supabase Storage. That works, but you lose the R2 egress savings. HEAD-check will 404 twice per file per session until DNS resolves.
- **The `nabulearn-media` bucket name is baked in.** If someone "cleans up" and renames it, every path breaks. Leaving it is correct.

### Verdict
**Real work: 5–15 min of Cloudflare dashboard clicks, no code changes required.** The rename didn't break R2 because `src/lib/cdn.ts` was already updated. You're 95% done.

---

## Part 2 — Super-admin site blocker toggle (benmaxweiner@gmail.com only)

The toggle component already exists: `src/components/student/sections/SiteSettingsSection.tsx`. It reads/writes `app_settings.demo_gate_enabled` with realtime sync — exactly what DemoGate.tsx listens to. So flipping it live-unlocks/locks the whole site instantly.

### What's missing
It's not mounted anywhere visible to Ben on the super-admin dashboard.

### Change
Edit `src/pages/superadmin/SuperAdminDashboard.tsx` to:
1. Read `useAuth()` to get current user email
2. If `user.email === "benmaxweiner@gmail.com"` (case-insensitive), render `<SiteSettingsSection />` in a new card at the top of the dashboard titled "Site Access — Private Preview Gate"
3. Any other super_admin sees the existing 3 cards but not this toggle
4. Server-side safety: the existing RLS on `app_settings` (checked below) already restricts writes to super_admin, so the email check is a UI convenience — not the security boundary. The DB is still the source of truth.

### Files touched
- `src/pages/superadmin/SuperAdminDashboard.tsx` — add auth import, add conditional card

### Verification
- Log in as benmaxweiner@gmail.com → visit `/super-admin` → toggle appears, flipping it hides/shows the Brecon50 gate on next page load for everyone
- Log in as a different super_admin → toggle does NOT appear
- Log in as anyone else → dashboard route already blocks non-super_admins

No database changes, no new components, no RLS work. ~10 lines of code.

---

## Total work for you
- **R2**: 5–15 min in Cloudflare, zero code
- **Toggle**: I implement it in one edit, you refresh the page

Say the word and I'll ship the toggle edit.
