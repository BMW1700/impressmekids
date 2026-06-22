# Light + Dark Mode on the Landing Page

Right now the landing sections are hard-locked to dark (`bg-[hsl(270_45%_8%)]`, `text-white`) — even though `ThemeProvider` from `next-themes` is already wired up at the app root, flipping themes does nothing on `/`. We'll fix that and add a whimsical light palette inspired by pic 3 (purple → peach gradient, frosted glass cards, sunny yellow accents).

## 1. Add a theme toggle to the Header

- New `ThemeToggle` button (sun/moon icon, swaps with `setTheme` from `next-themes`), placed in `src/components/Header.tsx` next to **Sign in**.
- Animated icon swap (rotate + fade). Persists via next-themes localStorage automatically.

## 2. Make landing sections theme-aware

Update the four sections that are currently hard-dark so they respond to the `.dark` class:

- `src/components/landing/PremiumHero.tsx`
- `src/components/landing/AudienceTrifurcation.tsx`
- `src/components/landing/BennyVideoHero.tsx` (Benny side of split hero)
- `src/components/landing/RPGShowcase.tsx` (RPG side of split hero)
- Closing CTA block inside `src/pages/Index.tsx`

Pattern: replace hard `bg-[hsl(...)] text-white` with semantic tokens that have dark + light variants, e.g.
```tsx
className="bg-[hsl(var(--landing-bg))] text-[hsl(var(--landing-fg))]"
```
and the gradient/glow overlays get a light-mode counterpart via `dark:` modifier.

## 3. Light theme — whimsical, like pic 3

Add new tokens to `src/index.css` under `:root` (light) and keep the existing dark values under `.dark`.

Light landing palette:
- **Background**: animated diagonal gradient `from-[hsl(270_70%_75%)] via-[hsl(320_75%_82%)] to-[hsl(30_95%_80%)]` (lavender → pink → peach, exactly the pic-3 mood).
- **Foreground text**: deep ink `hsl(270 40% 18%)` for headlines, `hsl(270 25% 35%)` for body.
- **Headline accent gradient**: keep the yellow→orange but warm it slightly for legibility on the light bg.
- **Cards (Benny panel, RPG panel, trifurcation cards)**: frosted glass — `bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-20px_hsl(270_60%_50%/0.35)]`.
- **Eyebrow chips**: warmer yellow on translucent white pill.
- **Mesh / glow blobs**: stay but recolored to peach/lavender at lower opacity instead of deep purple.

Dark theme stays exactly as it is today — no regressions to the current cosmic look.

## 4. Default behavior

- Keep `defaultTheme="system"` (already set in `App.tsx`), so users get whatever their OS prefers.
- Toggle in header lets them override.

## Out of scope

- Re-theming internal app routes (dashboards, game, admin). They already have their own dark styling and aren't what the user is reviewing. Only the public landing surfaces change here.
- No copy changes, no layout changes, no animation changes — purely color/contrast + a toggle button.

## Files touched

- `src/components/Header.tsx` — add ThemeToggle button
- `src/components/ThemeToggle.tsx` *(new)* — sun/moon switcher
- `src/index.css` — add `--landing-*` tokens for light + dark
- `src/components/landing/PremiumHero.tsx`
- `src/components/landing/AudienceTrifurcation.tsx`
- `src/components/landing/BennyVideoHero.tsx`
- `src/components/landing/RPGShowcase.tsx`
- `src/pages/Index.tsx` (closing CTA only)

## Verification

After build, drive Playwright to:
1. Load `/` in default (dark) — screenshot, confirm unchanged.
2. Click the toggle — screenshot, confirm purple→peach gradient, glass cards, dark text, headlines legible.
3. Toggle back — confirm clean return to dark.
