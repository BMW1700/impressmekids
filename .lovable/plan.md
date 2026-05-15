# Nabu Learn Landing Page — "Premium SaaS" Redesign (Tier 1)

## Goal
Make the marketing landing page feel like a $50M Series A literacy company (Linear, Vercel, Arc, Notion vibe) — visually impressive enough to make a superintendent stop scrolling, without breaking iPads or Chromebooks.

**Scope:** Marketing landing page only (`/` route). Zero changes to student/teacher/parent/admin app, auth, database, or any business logic.

---

## What you'll see when it's done

1. **Cinematic hero** — large kinetic headline that animates in word-by-word, soft animated gradient mesh background (CSS only, no WebGL), subtle floating orbs, and a magnetic CTA button. Headline stays "AI-Powered Literacy" per brand memory.
2. **Scroll-driven product reveal** — as you scroll, a stylized device frame (iPad mockup) tilts into view showing AURA in action, with a parallax glow behind it.
3. **Feature pillars section** — 3–4 large bento-grid cards (AURA, LexiQuest, Teacher Insights, Safety) with hover lift, gradient borders, and small looping micro-animations inside each card.
4. **"How it works" stepper** — sticky left column with 3 steps, right column animates between visuals as you scroll past each step.
5. **Outcomes / proof strip** — large numbers (e.g., "44 phonemes", "K–12", "$0 setup") with count-up animation on scroll-into-view.
6. **Quiet, premium footer** — refined type, subtle divider lines, no clutter.

Smooth section transitions throughout. Slow, confident motion — no bouncing, no neon, no crypto vibe. Stays on-brand with the existing "elegant restraint" memory rule.

## What I will NOT touch
- No changes to app routes, auth, Supabase, RLS, edge functions, or any feature code.
- No new dependencies beyond what's already in the project (framer-motion is already installed).
- No WebGL, no Three.js, no React Three Fiber, no heavy assets. Loads fast on iPad.
- No removal of existing landing sections that you've previously approved (pricing tiers, demo links) — they'll be restyled, not deleted.
- Tagline stays "AI-Powered Literacy". No "Science of Reading". No "For Free" / "Coming Soon". (Per memory.)

## Technical details (for the record)
- **Files touched:** `src/pages/Index.tsx` and the marketing section components it renders (`src/components/landing/*` if they exist, otherwise new ones colocated). `index.css` / `tailwind.config.ts` for new design tokens (gradient mesh, soft shadows, easing curves).
- **Motion:** framer-motion only — `useScroll`, `useTransform`, `whileInView`, staggered children. All easing slow (0.6–1.2s, custom cubic-bezier). Reduced-motion respected via `prefers-reduced-motion`.
- **Background:** CSS conic + radial gradients with slow `@keyframes` rotation, layered with a noise SVG overlay for grain. No canvas, no WebGL.
- **Type:** keep existing font stack but introduce one display weight for the hero headline (loaded from Google Fonts via `<link>` in `index.html` if not already present).
- **Performance budget:** First paint < 1.5s on a Chromebook. No image > 200KB. No new JS bundle > 30KB gzipped.
- **Accessibility:** semantic H1, alt text on all imagery, contrast ≥ 4.5:1, keyboard focus rings preserved.

## Out of scope (deferred for later)
- Any 3D / R3F hero element ("Tier 2") — revisit after patent filing.
- Custom photogrammetry / video assets.
- Replacing existing pricing/CTA copy (only restyling).

## Approval check
If this matches what you want, approve the plan and I'll build it in one pass. If you want me to swap any section (e.g. drop the bento grid, add a logo wall, change the order), tell me before approving.
