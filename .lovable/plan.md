# Plan: Audience doorway on `/` + dedicated `/for-families` Benny page

Patrick is right that Benny is the brand. We protect both bets by separating audiences instead of forcing one hero to talk to all three.

---

## Strategy in one line

`/` becomes a calm, audience-neutral **doorway** with three doors. Benny is **not** on `/`. Benny gets a full dedicated page at `/for-families` where the video is the hero and the CTA is "Start free" — built for daycare directors and parents, not superintendents.

---

## Part 1 — Rebuild `/` as the doorway

**Keep:** `PremiumHero` (existing cinematic hero), `OutcomesStrip`, `BentoFeatures`, `HowItWorks`, `GameModeSection`, `ResearchSection`, `TrustSection`, `TestimonialSection`, closing CTA. No copy or layout changes to those.

**Add:** A new `AudienceTrifurcation` section inserted **immediately below `PremiumHero`**, above `OutcomesStrip`.

Three cards, equal weight, dark theme, gold accents matching existing tokens:

```text
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  For Families    │  │  For K–12        │  │  For Districts   │
│  & Daycares      │  │  Schools         │  │                  │
│                  │  │                  │  │                  │
│  Meet Benny.     │  │  Adaptive RPG    │  │  NAEP-grade ML.  │
│  Ages 2–5.       │  │  literacy for    │  │  $5–7/student.   │
│  Read together.  │  │  K–12 classrooms.│  │  FERPA aligned.  │
│                  │  │                  │  │                  │
│  → /for-families │  │  → /demos        │  │  → /pricing      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Each card has a small visual marker (no full media on `/` — keeps load fast and avoids the puppy-in-front-of-superintendents problem).

---

## Part 2 — Build new page at `/for-families`

This is where Benny earns his keep. Full page, dedicated audience.

**Sections, top to bottom:**

1. **Video hero** — Benny `Initial_Scene` video as a full-bleed cinematic stage (centered 16:9, cinema letterboxing, gold radial glow). Headline: **"Reading. With their first best friend."** Subhead: "Meet Benny. Ages 2–5. Adventures kids ask for by name." CTAs: "Start free" (primary) + "For daycare directors" (secondary).
2. **"Meet Benny"** — Three still frames from the Pre-K adventure (`benny-celebrate`, `benny-idle`, `L1-grandma-ending` thumbnail), each with a one-line caption.
3. **How Pre-K works** — Three steps: Watch → Say the word → Benny's world responds. Pulled from existing `preKAdventuresVideo.ts` story flow as proof points.
4. **For parents / For daycares** — Two-column split. Parent column: "$X/month, cancel anytime, no ads." Daycare column: "Center licenses, multi-classroom, simple onboarding." (Pricing copy uses placeholder — see Open Questions.)
5. **Safety strip** — COPPA, no ads, no third-party tracking. Reuses existing trust copy patterns.
6. **Closing CTA** — "Start Benny's first adventure" → existing `/game` route (Pre-K mode is the natural drop-in).

**Veo watermark mitigation:** the Pre-K audience reads it as "warm AI-animated cartoon," not "AI slop." We accept it as-is on this page. We do NOT re-export or try to crop it.

---

## Part 3 — SEO & navigation

- `index.html` title stays as-is (corporate). Add new `/for-families` route with its own `<Helmet>` title `"Benny's Reading Adventures — NabuLearn for Families"` and meta description targeted at parents.
- Add `/for-families` to the existing `Header` nav (or a footer link — see Open Questions).
- Add `/for-families` to `public/sitemap.xml`.

---

## Files

**New:**
- `src/components/landing/AudienceTrifurcation.tsx` — the 3-card section
- `src/pages/ForFamilies.tsx` — the dedicated Benny page
- `src/components/landing/BennyVideoHero.tsx` — reusable cinematic video stage (poster + autoplay-muted + reduced-motion fallback)
- `src/assets/nabu-hero.mp4.asset.json` — upload the user's video via `lovable-assets`
- `src/assets/nabu-hero-poster.jpg.asset.json` — frame extracted at ~1s via `ffmpeg`

**Edited:**
- `src/pages/Index.tsx` — insert `<AudienceTrifurcation />` between `<PremiumHero />` and `<OutcomesStrip />`
- `src/App.tsx` (or router file) — register `/for-families` route
- `src/components/Header.tsx` — add "Families" nav link (pending answer)
- `public/sitemap.xml` — add `/for-families`

**Untouched:** `PremiumHero`, `BentoFeatures`, `OutcomesStrip`, `ModeSelect`, all game/dashboard code.

---

## Technical notes

- Video stage: `<video>` with `poster`, `preload="metadata"`, `autoplay muted loop playsinline`. `prefers-reduced-motion` → show poster `<img>` + play button.
- Mobile: poster image only by default, tap-to-play. Avoids autoplay battery hit on phones.
- All colors via existing tokens (`hsl(48 100% 55%)` gold, `hsl(270 45% 8%)` dark stage). No hardcoded hex.
- Animations via existing Tailwind `animate-fade-in` + framer-motion patterns already used in `Index.tsx`.

---

## Out of scope

- No changes to `ModeSelect` (`/mode`), game routes, or Pre-K mode internals.
- No payment integration on `/for-families` yet — CTA goes to existing `/auth` or `/game` until we decide pricing.
- No new video edit, no re-render, no watermark removal.

---

## Open questions before build

1. **`/for-families` CTA destination** — should "Start free" go to `/auth` (signup), `/game` (try Pre-K immediately), or a new `/parents/signup`?
2. **Header nav** — add "Families" as a top-level nav link, or keep it footer-only + cross-linked from the homepage trifurcation card?
3. **Pricing copy on `/for-families`** — placeholder ("$X/month") for now, or do you have a number Patrick has agreed on?
