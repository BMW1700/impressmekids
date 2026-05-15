# RPG Battle Showcase — Landing Hero + Mode Select

## Goal
Make the landing page and the Game Mode entrance feel like the RPG product itself — two existing in-game characters facing off, throwing a power (fireball ⇄ ice blast) at each other in a slow, looping, cinematic battle. This becomes the visual hook that tells visitors in 2 seconds: "this is a literacy RPG."

## Where it shows up
1. **Landing hero** (`src/components/landing/PremiumHero.tsx`) — full-bleed showcase behind/around the headline.
2. **Mode Select** (`src/pages/ModeSelect.tsx`) — smaller version above the School/Game cards.
3. **Game Mode dashboard** entry (`/game` route, the screen in screenshot 3) — banner above "Welcome to NabuLearn" cards.

## What the showcase looks like

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   [HERO]   ── 🔥 fireball ──▶                              │
│   knight                                ◀── ❄️ ice ──  [VILLAIN]
│                                                  goblin   │
│   (idle bob)                              (idle bob)       │
│                                                            │
│        ✦  particles + screen flash on impact  ✦            │
└────────────────────────────────────────────────────────────┘
```

- Left: a real `RPGCharacter`/sprite from the existing roster (knight/dame hero).
- Right: a real boss sprite (goblin/villain) from `MiniGoblin` or `RPGCharacterSprite`.
- Every ~3.5s they trade an attack: hero fires a fireball → villain hit-flash → villain fires an ice blast → hero hit-flash → loop.
- Idle bobbing between attacks. Subtle screen-glow tint matching the active element (orange / cyan).
- Headline ("AI-Powered Literacy for every classroom.") sits **above or in front** of the scene, with a soft radial vignette so type stays readable.

## How it's built (technical)

### New component
`src/components/landing/RPGShowcase.tsx`
- Props: `variant: 'hero' | 'compact'`, `autoplay?: boolean`.
- Reuses existing assets — **no new 3D, no new dependencies**:
  - `RPGCharacter` or `RPGCharacterSprite` (left, hero pose)
  - `MiniGoblin` or a boss sprite (right)
  - `RPGParentAttackVFX` already implements `fireball`, `ice_blast`, `lightning`, `wind_slash` — perfect, reusable.
- Internal state machine cycles: `idle → heroAttack → villainHit → idle → villainAttack → heroHit → idle`. Each step ~700–1100ms (matches `RPGParentAttackVFX` `DURATION_MS`).
- Uses framer-motion for character bob, hit-shake, recoil, and impact flash.
- Respects `useReducedMotion`: falls back to a static "frozen mid-battle" pose with one fireball drawn but not animated.

### VFX direction reuse
`RPGParentAttackVFX` currently fires right→left. We add a `direction: 'rightToLeft' | 'leftToRight'` prop (or a mirrored CSS transform wrapper) so the hero's fireball travels left→right and the villain's ice travels right→left. Tiny addition, no breaking changes.

### Hero integration
`PremiumHero.tsx` — slot `<RPGShowcase variant="hero" />` as an absolutely-positioned layer behind the headline (z-index below text, above gradient mesh). Headline gains a subtle radial dark vignette behind it for legibility.

### Mode Select + Game Dashboard integration
- `ModeSelect.tsx`: add `<RPGShowcase variant="compact" />` above the two mode cards (replaces or sits above the current "Welcome to NabuLearn" text).
- `/game` dashboard top: same compact variant above the "Sign in to start your adventure" card.

## Performance + constraints
- All sprites are existing React/SVG — no new image downloads, no WebGL, no R3F.
- One `RPGShowcase` instance per page; pauses when off-screen via `IntersectionObserver` so it doesn't burn CPU on scroll.
- Bundle delta: ~3–6KB gzipped (one new component file).
- Honors reduced-motion. Works on iPad Safari and Chromebook (no GPU-heavy effects).
- Zero changes to game logic, auth, Supabase, or any business rules.

## Out of scope
- No new 3D character models, no R3F, no photogrammetry.
- No changes to the actual RPG battle engine.
- No new character art — uses what's already in `src/components/aura/game/rpg/`.
- No copy changes beyond optionally tightening the hero subhead.

## Files touched
- **New:** `src/components/landing/RPGShowcase.tsx`
- **Edit:** `src/components/landing/PremiumHero.tsx` (slot the showcase)
- **Edit:** `src/pages/ModeSelect.tsx` (slot the compact showcase)
- **Edit:** the `/game` dashboard top section (compact showcase)
- **Edit:** `src/components/aura/game/rpg/RPGParentAttackVFX.tsx` — add optional `direction` prop, default preserves current behavior
- **Edit:** `.lovable/plan.md`

## Open question (one)
Which two characters should star in the showcase?
- **Option A (recommended):** Knight hero vs. classic Goblin boss — most iconic, instantly readable.
- **Option B:** Dame hero vs. Shadow boss — moodier, fits the dark hero aesthetic.
- **Option C:** Rotate randomly per page load from a curated 4-pair list.

Confirm the pick (or say "you choose") and I'll build it.
