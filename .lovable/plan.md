

# Rebrand: ImpressMe Kids → NabuLearn

## Scope

This is a **find-and-replace rebrand** across the entire codebase. Based on my search, there are **~670 matches across 51 source files** plus **~100 matches across 8 non-source files** (markdown guides, CSS, manifest, etc.).

## Naming Convention

| Old | New |
|-----|-----|
| ImpressMe Kids | NabuLearn |
| Impress Me Kids | NabuLearn |
| ImpressMe Family App | NabuLearn |
| An ImpressMe Family App | Powered by NabuLearn |
| impressmekids.com (emails) | nabulearn.com |
| @impressme (Twitter) | @nabulearn |

## What Changes

### High-visibility files (user-facing)
1. **Header.tsx** — Logo alt text, title "NabuLearn", remove "An ImpressMe Family App" subtitle (or change to tagline like "The Science of Reading")
2. **Footer.tsx** — Copyright "© 2026 NabuLearn", remove "An ImpressMe Family App ✨", update domain references
3. **index.html** — `<title>`, meta tags, OG tags, apple-mobile-web-app-title, author
4. **site.webmanifest** — name, short_name
5. **LanguageContext.tsx** — All translation strings referencing the old name (en, es, fr)
6. **DemoGate.tsx** — Any branding text on the gate screen

### Pages & policies (~15 files)
7. **TermsOfService.tsx** — legal@impressmekids.com → legal@nabulearn.com
8. **PrivacyPolicy.tsx** — privacy@impressmekids.com → privacy@nabulearn.com
9. **All policy pages** (SystemDescription, IncidentResponse, RiskRegister, VPAT, SecurityAwareness, BackupDisasterRecovery, IncidentResponseTabletop) — All "Impress Me Kids" references and email addresses → NabuLearn / nabulearn.com

### Edge functions (~5 files)
10. **send-safety-alert** — from email, body text
11. **send-parent-consent-email** — from email, subject, body, APP_URL fallback
12. **send-calendar-notifications** — from email
13. **send-push-notification** — VAPID mailto
14. **send-drill-notification** — from email
15. **clever-sync-callback** — APP_URL fallback
16. **restore-cold-storage-backup** — support email

### Internal components (~20 files)
17. **ParentalConsentForm.tsx** — consent text
18. **PWAInstallGuide.tsx** — install instructions
19. **RequestRestorationDialog.tsx** — support team references
20. **calendarUtils.ts** — PRODID and UID domain
21. **Landing page sections** (TestimonialSection, StatsSection, etc.) — any remaining brand references

### Non-source files (markdown guides)
22. **SECURITY_OVERVIEW.md, SCHOOL_ADMIN_SECURITY_GUIDE.md, CLEVER_INTEGRATION_GUIDE.md, GOOGLE_SSO_SETUP_GUIDE.md, PHASE_2 docs** — All old name references

### CSS
23. **src/index.css** — Comment "Impress Me Kids Purple & Yellow Theme" → "NabuLearn Theme"

## What Does NOT Change
- The logo image file itself (`src/assets/logo.png`) — you'll need to upload a new logo separately
- Color scheme / design system (unless you want that changed too)
- Any database tables or RLS policies
- The DemoGate access code (stays `Brecon69`)

## Approach
Systematic file-by-file replacement. All ~51 source files + 8 non-source files updated in one pass. Every instance of "ImpressMe Kids", "Impress Me Kids", "ImpressMe Family", "impressmekids.com" replaced with "NabuLearn" / "nabulearn.com".

## Domain Setup
After the code rebrand, you'll need to:
1. Go to **Project Settings → Domains** in Lovable
2. Click **Connect Domain** and enter `nabulearn.com`
3. At your domain registrar, add an A record pointing to `185.158.133.1` and a `www` A record to the same IP
4. Add `www.nabulearn.com` as well so both resolve

