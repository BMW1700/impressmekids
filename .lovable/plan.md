# Rebrand: Nabu → Yubi Learn — Grand Plan (1 hour)

Product name: **Yubi Learn**. Domain target: **yubilearn.com**. Character "Nabu the Owl" stays as-is (in-world character name, not a brand liability — kids are attached, and it de-risks IP if "Nabu" ever gets pushed on).

## Timeline

```text
T+0min    You: buy yubilearn.com (Lovable Domains or registrar)
T+5min    You: in Lovable, connect yubilearn.com, set as Primary
T+10min   You: in Cloudflare, add cdn.yubilearn.com as 2nd Custom Domain on R2 bucket
T+15min   Me:  execute all code changes below (single push)
T+45min   Verify: video plays via cdn.yubilearn.com, site renders "Yubi Learn"
T+55min   Publish
T+60min   Done. nabulearn.com stays as alias for ~30 days.
```

## Code changes (I execute in one pass)

### 1. Brand string replacement across the codebase
Global find/replace (case-sensitive, word-boundary aware):
- `NabuLearn` → `YubiLearn`
- `Nabu Learn` → `Yubi Learn`
- `nabulearn` → `yubilearn`
- `Powered by NabuLearn` → `Powered by Yubi Learn`
- `@nabulearn` (twitter handle) → `@yubilearn`

**Preserved (not replaced):**
- `Nabu the Owl` character name and all references (`NabuOwl.tsx`, `nabuStoryCopy.ts`, `nabu-hero.mp4`, in-game copy, Bobo/Echo/Nabu Buddies memory)
- Internal R2 bucket name `nabulearn-media` (cosmetic-only; renaming = pointless re-copy of 1,072 files)
- Supabase project internals (URL, project ref)
- Filenames of existing assets (`nabu-hero-poster.jpg`, etc.) — renaming would break asset imports for no user-visible gain
- Historical docs (PHASE_*_COMPLETE.md, IMPLEMENTATION_COMPLETE.md) — leave as archived history

### 2. Files touched
- `index.html` — title, description, og:title, og:url, og:description, JSON-LD Organization+WebSite, apple-mobile-web-app-title, canonical
- `public/site.webmanifest` — name, short_name, description
- `public/llms.txt` — heading + description
- `public/sitemap.xml` — all `<loc>` domains (18 URLs)
- `public/robots.txt` — sitemap URL if referenced
- `src/components/Footer.tsx` — © line and "Powered by NabuLearn ✨"
- `src/lib/cdn.ts` — `CDN_BASE` → `https://cdn.yubilearn.com`
- Landing/marketing pages, meta tags in `src/pages/Index.tsx`, `Pricing.tsx`, `Demos.tsx`, etc.
- Email templates in `supabase/functions/*email*` — sender name, footer signature
- `CONTRACT_READINESS.md`, `SECURITY_OVERVIEW.md`, `SECURITY_POSTURE.md`, `SCALE_READINESS_AUDIT.md`, `README.md`, `docs/soc2/*` — brand name in user-facing sections only
- Language files / i18n copy referencing "NabuLearn"
- `capacitor.config.ts` app name (for iOS/Android builds later)

### 3. Meta tag updates (`index.html`)
- Title: `Yubi Learn — AI-Powered Literacy Platform`
- Description: unchanged wording, "NabuLearn" → "Yubi Learn"
- `og:url` and canonical → `https://yubilearn.com/`
- JSON-LD name/url → Yubi Learn / yubilearn.com
- twitter:site → `@yubilearn` (register the handle separately)

### 4. CDN cutover (single line)
`src/lib/cdn.ts`:
```ts
const CDN_BASE = "https://cdn.yubilearn.com"; // was cdn.nabulearn.com
```
Existing R2 fallback logic (signed Supabase URL on 404) remains intact — protects us if `cdn.yubilearn.com` hasn't fully propagated when a student loads a video.

## What you handle (outside code)

| # | Task | Where | Time |
|---|------|-------|------|
| 1 | Buy `yubilearn.com` | Project Settings → Domains → Buy new domain | 5 min |
| 2 | Connect + set Primary | Same page | 5 min |
| 3 | Add `cdn.yubilearn.com` on R2 bucket `nabulearn-media` | Cloudflare dashboard → R2 → Custom Domains → Connect Domain | 5 min |
| 4 | Update email sender DNS records (SPF/DKIM) for `yubilearn.com` | Project Settings → Email domain setup | 10 min |
| 5 | Register `@yubilearn` on X/Twitter | twitter.com | 2 min |

## What stays 100% untouched
- Google OAuth (Lovable-managed, auto-covers new custom domain)
- Clever SSO (redirect URI is Supabase edge function, not marketing domain — verified in `src/pages/Auth.tsx:316`)
- Supabase project, database schema, edge functions, RLS policies
- R2 bucket contents (all 1,072 files stay in `nabulearn-media`)
- All game data, saves, student progress, classrooms

## Cost impact
- One-time: ~$12 for domain
- Recurring: $0 change. Cloudflare custom hostnames are free. R2 pricing unchanged.

## Trademark note (you accepted the risk, logging for the record)
Not doing a TESS check before launch. Yubi is used by yubi.com (Indian fintech) — different class, edtech should be clear. Recommend running a proper TM search this week and filing in Class 41 (education services) + Class 9 (educational software) once revenue justifies the ~$750 filing fee.

## Post-flip verification checklist (I run this)
1. Load `yubilearn.com` → renders "Yubi Learn" branding
2. Load a Pre-K video → served from `cdn.yubilearn.com`, no black flash
3. Google sign-in works on `yubilearn.com`
4. Clever sign-in works on `yubilearn.com`
5. Old `nabulearn.com` still loads (alias fallback)
6. Footer, meta tags, page titles all say "Yubi Learn"

## Rollback plan (if something breaks)
- Revert `CDN_BASE` in `cdn.ts` → back to `cdn.nabulearn.com` (1-line change)
- `nabulearn.com` stays connected as alias, so worst case we set it as Primary again
- Zero data risk — no schema/database changes in this plan

Approve and I'll execute the moment you flip me to build mode. You start on your 5 tasks in parallel.
