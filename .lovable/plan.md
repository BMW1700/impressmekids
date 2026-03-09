

# Plan: Landing Page Redesign + RPG Enemy Sync Fix

## Two Problems Identified

### Problem 1: RPG Enemy Desync Bug
**Root cause found.** There are TWO places that build level data and map enemies:
1. `src/pages/student/AuraPractice.tsx` (lines 394-435, 443-471) — has the **full** enemy map with all 20+ enemy types (cave_troll, storm_harpy, ink_kraken, void_phantom, etc.)
2. `src/components/student/sections/AuraReadingSection.tsx` (lines 353-400) — has an **incomplete** enemy map with only 4 types (minion, guard, elite, boss), and also casts enemies to a narrow type `('minion' | 'guard' | 'elite' | 'boss' | 'dragon')[]`

**Result:** Students entering RPG mode through different entry points (standalone AuraPractice page vs. embedded AuraReadingSection) see different enemies. In AuraReadingSection, any world 5-8 enemy falls back to `'minion'` because the map is incomplete.

**Fix:** Sync AuraReadingSection's enemy type cast and enemyMap to match AuraPractice exactly — include all 20+ enemy types in both the type assertion and the enemyMap.

### Problem 2: Landing Page — Not the Only Problem, But the Biggest
The landing page is generic and undersells the product. Here is what will change:

**Hero Section** — Replace generic headline with the AURA differentiator:
- New headline: **"The AI Reading Platform That Replaces $15/Student Assessments — For Free"**
- New subheadline referencing AURA + SSVRS safety system
- Keep "Try our Demo" + "Start Free Trial" CTAs

**Stats Section** — Replace adjectives with concrete proof points:
- "$0/student" vs "$10-15 with DIBELS"
- "4 Proprietary ML Models" 
- "5 Playable Games + RPG Campaign"
- "538+ Security Policies"

**Testimonials Section** — Replace fake testimonials with a "Request a Pilot" CTA + demo video embed placeholder. Remove fabricated names entirely to avoid credibility damage.

**Research Section** — Already good, move it ABOVE the features section so differentiators appear first.

**Section reorder:**
1. Hero (rewritten)
2. Stats (concrete numbers)
3. Research/Innovation (moved up — this is the differentiator)
4. Features (existing, minor copy tweaks)
5. Built for Every Role (existing)
6. Trust & Security (existing)
7. New "Request a Pilot" CTA (replaces fake testimonials)
8. Footer CTA

## Files to Change

| File | Change |
|------|--------|
| `src/components/student/sections/AuraReadingSection.tsx` | Fix enemy type cast (line 379) and add complete enemyMap (lines 394-399) matching AuraPractice.tsx |
| `src/pages/Index.tsx` | Rewrite hero headline/subheadline, reorder sections (Research before Features), replace testimonial with pilot CTA |
| `src/components/landing/StatsSection.tsx` | Replace generic stats with concrete numbers |
| `src/components/landing/TestimonialSection.tsx` | Replace fake testimonials with "Request a Pilot" section + demo video placeholder |

## What This Does NOT Change
- No backend changes
- No new routes or pages
- No game mechanics changes
- RPG campaign data (`campaignData.ts`) is already correct — the bug is purely in how the two entry points consume it

