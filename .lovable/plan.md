## My brutally honest call: Weighted Split (Benny-dominant)

Equal 50/50 reads as "we have two products and don't know which matters." Benny-only buries the K–12 RPG that's already shipped and paying the bills. The winning move is **one screen, two panels, Benny visually dominant, both reachable in one click.**

This is what I'm building.

---

## New `/` (ModeSelect.tsx) layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: NabuLearn logo · Pricing · Sign in · 🛡 (super admin)│
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   BENNY PANEL (~55%)         │   K–12 RPG PANEL (~45%)      │
│   Warm gradient bg           │   Dark RPG bg                │
│                              │                              │
│   [Benny video / poster]     │   [RPG screenshot still]     │
│                              │                              │
│   "Reading. With their       │   "Reading IS the combat     │
│    first best friend."       │    mechanic."                │
│   Ages 2–5                   │   Ages 6–18 · Grades K–12    │
│                              │                              │
│   [Start Benny's adventure→] │   [Enter the Adventure →]    │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
  Tiny center link: "I'm a teacher / school →"  ·  scroll ↓ for more
```

**Interaction:**
- Hover (desktop) or tap (touch) a panel → it scales to ~60%, other dims to ~75% opacity. Smooth 400ms ease.
- Click the CTA inside the panel → routes (`/game` for Benny, `/game?mode=rpg` or existing K-12 entry for RPG).
- Mobile/iPad portrait: panels stack vertically (Benny top, RPG bottom), each ~50vh, equally tall, no hover state.

**Below the fold (scroll reveals, doesn't compete):**
1. `<AudienceTrifurcation />` — Families / Teachers / Schools doorways (reuse existing)
2. `<RPGShowcase variant="hero" />` — keep existing lazy-loaded demo
3. Returning-players quiet link + legal footer

---

## Veo3 watermark fix

Inside `BennyVideoHero.tsx`, wrap the `<video>` in a container with `overflow-hidden` and apply `object-cover` + a slight negative right/bottom offset (or `clip-path: inset(0 4% 5% 0)`). This crops the bottom-right corner where "Veo" sits — we lose ~5% of the frame edge but Benny stays centered. No re-render needed.

---

## Files touched

- **`src/pages/ModeSelect.tsx`** — full rewrite to weighted-split layout. Keeps all existing auth-redirect logic, `useAuth`, `useIsSuperAdmin`, game-player auto-routes, `skipRedirect`, and `<Helmet>` SEO.
- **`src/components/landing/BennyVideoHero.tsx`** — add `clip-path` / overflow crop on the video wrapper to hide "Veo" watermark.
- **No changes** to: `BennyVideoHero` video asset, `AudienceTrifurcation`, `RPGShowcase`, `ForFamilies`, `Index.tsx`, `/school`, header, routes, backend.

## Design tokens

- Benny panel bg: warm gradient using existing `--accent` / soft gold tokens already in `index.css`
- RPG panel bg: existing dark RPG palette already in use on the showcase
- Headline font: existing project sans (no new font installs)
- Gold accent on "first best friend": existing gold gradient token
- Hover scale: `scale-[1.02]` + sibling `opacity-75 scale-[0.98]`, `transition-all duration-500 ease-out`

## Why this is the right call (one more time)

1. **One screen, one click to action** — fixes your "pathways are confusing" complaint.
2. **Benny dominates visually** (55%, warmer art, animated video) — Patrick's partner sees Benny first.
3. **K–12 RPG isn't hidden** — your real revenue product stays on the front page.
4. **Mobile/iPad survives** — stacks cleanly; no broken split.
5. **Reversible** — one file rewrite; if it flops in 2 weeks we revert.

Approve and I'll build it.