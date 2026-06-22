# Plan: Benny takes over `/` (Option A)

`/` becomes a real landing page that leads with Benny. The current generic "Welcome to NabuLearn" + two-glass-card layout is replaced. Existing access paths (Adventure / Super Admin) are preserved as secondary actions so no signed-in user loses their flow.

---

## New `/` structure, top to bottom

```text
┌─────────────────────────────────────────────────────────┐
│  [logo]  NabuLearn                    [Sign in] [Pricing]│  ← minimal top bar
│                                                         │
│        Reading. With their first best friend.           │
│         Meet Benny. Ages 2–5. Read-along adventures.    │
│                                                         │
│        ╔═══════════════════════════════════════╗        │
│        ║                                       ║        │
│        ║    [ BENNY VIDEO — autoplaying ]      ║        │
│        ║                                       ║        │
│        ╚═══════════════════════════════════════╝        │
│                                                         │
│        [ Start Benny's adventure → ]  [ I'm a teacher ] │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              Choose your path                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Families │  │   K–12   │  │Districts │               │
│  │ /for-fam │  │ /demos   │  │/pricing  │               │
│  └──────────┘  └──────────┘  └──────────┘               │
├─────────────────────────────────────────────────────────┤
│        [ Live RPG showcase — Whispers in the Dark ]     │
├─────────────────────────────────────────────────────────┤
│   Returning players →  [ Enter the Adventure ]          │
│   (small, quiet, link-style, NOT a hero card)           │
├─────────────────────────────────────────────────────────┤
│   Privacy · Terms · COPPA · Security · DPA · All legal  │
└─────────────────────────────────────────────────────────┘
```

---

## What changes

**Replace** the entire visible body of `src/pages/ModeSelect.tsx` with a Benny-first hero:

1. **Hero block** — Reuse `BennyVideoHero` (already built for `/for-families`). Headline: **"Reading. With their first best friend."** Subhead: "Meet Benny. Ages 2–5. Adventures kids ask for by name." Two CTAs:
   - Primary: "Start Benny's adventure" → `/game`
   - Secondary: "I'm a teacher / school" → `/demos`
2. **Doorway trifurcation** — Reuse the existing `<AudienceTrifurcation />` component as-is.
3. **RPG showcase** — Keep the existing lazy-loaded `<RPGShowcase variant="hero" />` block exactly where it is in markup, just lower in the page. Proof the product is real.
4. **"Returning players" footer row** — A small, quiet text link `Returning player? Enter the Adventure →` that routes to `/game`. Replaces the current giant glass card. Game-mode users keep their path; new visitors aren't distracted by it.
5. **Super Admin entry** — Stays gated to `super_admin` role, but moves to a small icon-button in the top-right header area (next to Sign in / Pricing), not a hero card. Same `useIsSuperAdmin` check, same destination `/super-admin`.

**Preserve** all existing auth-redirect logic at the top of `ModeSelect.tsx`. Signed-in school users with a district still auto-redirect to their dashboard. `skipRedirect` still works. Game-player role still auto-routes to `/game/dashboard`. None of that logic changes — only the visible layout for the unsignedinor-still-on-page state changes.

**Keep** the existing `<Helmet>` SEO block, but update the title/description to match the new Benny-led framing:
- title: `"NabuLearn — Reading adventures with Benny. K–12 literacy that feels like a game."`
- description: `"Meet Benny — read-along adventures for ages 2–5. Plus an AI-powered K–12 literacy RPG. FERPA, COPPA & SOC 2 aligned."`

---

## Files

**Edited:**
- `src/pages/ModeSelect.tsx` — full layout rewrite of the rendered JSX. Auth logic + helmet + super-admin gate logic untouched.

**Untouched:**
- `src/components/landing/BennyVideoHero.tsx` (reused as-is)
- `src/components/landing/AudienceTrifurcation.tsx` (reused as-is)
- `src/components/landing/RPGShowcase.tsx` (reused as-is)
- `src/pages/ForFamilies.tsx` (already shipped)
- `src/pages/Index.tsx` and `/school` route (still hidden, untouched — trifurcation already present there is harmless)
- `App.tsx` routes — no changes
- All game / dashboard / auth code

---

## Why this is the right call

- **Benny in 2 seconds.** Patrick can screen-share `/` to any partner and Benny is the first thing they see. Today, he isn't on `/` at all.
- **Audience self-select stays.** The trifurcation right below the hero means superintendents and district CFOs aren't confused — they have a labeled door.
- **No returning user loses their path.** "Enter the Adventure" still exists as a quiet returning-player link. Super Admin still exists for you. Auto-redirects for signed-in school users still fire before the page even renders.
- **Reversible.** If it doesn't perform in 2 weeks, the old layout is one commit away — same component imports, just reordered.

---

## Out of scope

- No video re-edit, no Veo watermark removal.
- No new routes.
- No backend / auth changes.
- No removal of `Index.tsx` or `/school`.
- No copy changes outside `ModeSelect.tsx` and its `<Helmet>`.
