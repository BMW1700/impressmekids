# Epic Hero Showcase Redesign

## Goal
Transform the battle preview so a first-time visitor instantly understands:
1. **Kids read real stories** (not random battle words) → those stories defeat enemies
2. **Every literacy metric is tracked live** (WPM, WCPM, accuracy, phoneme mastery, fluency)
3. Fits in **one viewport** (no scroll to see the whole thing)
4. Feels **premium / "$2+/month worth it"** — cinematic, not cluttered

## Scope
**Single file edit:** `src/components/landing/RPGShowcase.tsx` (variant="hero").
No changes to characters, VFX, page layout, or other components.
Compact variant stays as-is (used inside game pages).

## New Layout (single viewport, ~560–620px tall)

```text
┌───────────────────────────────────────────────────────────────┐
│ [HERO ████████░░] HP   ← READING "The Goblin's Cave" Ch. 2 →   [WRAITH ██████░░] HP │
├──────────────┬───────────────────────────────────┬────────────┤
│              │  ┌─ STORY PANEL ──────────────┐   │            │
│              │  │ Mira crept past the goblin │   │            │
│              │  │ guard, her ✦banish✦ spell  │   │  ENEMY     │
│   HERO       │  │ ready in her trembling…    │   │  (right)   │
│   (left)     │  └────────────────────────────┘   │            │
│              │   words light green as read       │            │
│              │   miscue word flashes amber       │            │
├──────────────┴───────────────────────────────────┴────────────┤
│  LIVE METRICS RAIL (always visible, updates per word)         │
│  ┌─────────┬─────────┬──────────┬────────────┬────────────┐   │
│  │ WPM 112 │ WCPM 98 │ ACC 94%  │ PHONEME 91%│ FLUENCY A- │   │
│  │  ↑ live │  ↑ live │  ▓▓▓▓░   │  /sh/ /th/ │  prosody ✓ │   │
│  └─────────┴─────────┴──────────┴────────────┴────────────┘   │
│         "Read words → launch powers · tracked in real time"   │
└───────────────────────────────────────────────────────────────┘
```

## What Changes vs Current

| Element | Now | After |
|---|---|---|
| Word ticker | 3 generic words ("blast the goblin") | Real story sentence (1–2 lines) with the **power word** highlighted as ✦banish✦; reads left→right, words turn green |
| Header context | Just HP bars | HP bars + center chip: **"READING · The Goblin's Cave · Ch. 2"** so parents see it's a *story* |
| Metrics | None visible | Persistent bottom rail: WPM, WCPM, Accuracy %, Phoneme mastery, Fluency grade — numbers tick up live as words are read |
| Caption | "Read words → launch powers" | "Read words → launch powers · tracked in real time" |
| Height | h-[460px] desktop, content sometimes overflows page | Fixed total ≤ 600px, sized so hero + headline fit in one viewport on laptop (~720px tall after nav) |
| Story rotation | 4 enemies, 3 throwaway words each | 4 enemies, each tied to a real micro-story title + sentence containing the spell word |

## Story Content (inline, no backend)

Each enemy gets `{ title, sentence, powerWord, attack }`:
- Goblin Guard → *"The Goblin's Cave"* — "Mira raised her staff and whispered **blast** before the goblin could move."
- Shadow Wraith → *"Whispers in the Dark"* — "Only one word could **banish** the wraith back to the shadow realm."
- Drake the Dragon → *"The Dragon's Bargain"* — "She had to **tame** the dragon before its fire reached the village."
- Ice Golem → *"Frozen Halls"* — "One sharp spell would **shatter** the golem and free the trapped explorers."

Power word styled with subtle gold glow + ✦ markers so it visually "launches" the attack when read.

## Live Metrics Behavior

All client-side counters driven by the existing phase machine (no real audio):
- **WPM**: idles ~95, rises to 110–125 during reading phase, eases back
- **WCPM**: WPM minus miscues; on the planted miscue word it briefly flashes red and dips
- **Accuracy**: starts 100%, dips to ~94% on the seeded miscue word, recovers
- **Phoneme mastery**: small chip showing rotating phoneme tags (`/sh/ 92%`, `/th/ 88%`) — gives the "we track this" signal
- **Fluency**: letter grade A / A- / B+ that animates a tick when prosody is "good"

Numbers animated with `motion` value tweens; no new dependencies. Reduced-motion users see a static populated state.

## Sizing & Responsive

- Hero variant container: `h-[560px] sm:h-[580px] md:h-[600px]` (fixed total)
- Internal grid: header (56px) + stage (1fr) + metrics rail (96px)
- Characters drop one size class on `<sm` so they don't crowd the story panel
- Story panel: `max-w-[440px]` centered, `text-base sm:text-lg`, max 2 lines
- Metrics rail collapses to 3 cards on mobile (WPM, ACC, FLUENCY); full 5 on `sm+`

## Out of Scope
- No edits to characters, VFX layer, GameModeSection, LiveAssessmentShowcase, PremiumHero, Index
- No real speech recognition — this is the marketing showcase
- Compact variant (used in `/game` pages) stays untouched

## Technical Notes
- Single file: `RPGShowcase.tsx`
- Uses existing `framer-motion` (already imported), no new deps
- New sub-components (in same file): `StoryPanel`, `MetricsRail`, `StoryHeader`
- Replace the current `ReadingTicker` only inside `variant="hero"`; compact path keeps the old ticker
- Phase timings nudged: `reading` 3200ms (longer to read sentence), other phases unchanged so total cycle stays ~9s
