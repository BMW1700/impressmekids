# Pilot Lockdown Plan — Absolute Minimum (v7, confirmed)

Two deliverables: (1) email reply to David Liu for next Tuesday, and (2) the brutally trimmed pilot-close list. Confirmed via re-audit — the platform is pilot-ready; what's missing is the paperwork a principal/director needs on the table, plus two tiny read-only additions.

Nothing in this plan touches the redub/music pipeline, Challenge Meter, RPG, AURA runtime, canon Benny videos, or any existing route.

---

## Part 1 — Email reply to David Liu (send Tuesday)

Subject: **Re: Imagine Learning — how YubiLearn is different**

> Hi David,
>
> Thanks for sending this over — hope Disney was good. You're right that Imagine Learning is the incumbent giant (roughly half of US districts, 30 years in), so it's a fair comparison. I spent time inside their **Imagine Language & Literacy** product — the piece closest to what we do — and here's the honest read.
>
> **Where we overlap.** Both are adaptive, gamified, K-6 literacy practice covering phonics, vocabulary, comprehension, and ELL support with teacher dashboards. On the surface we look similar.
>
> **Where YubiLearn is meaningfully different.**
>
> 1. **We measure oral reading; they measure taps.** Imagine's activities are click, drag, and multiple-choice. YubiLearn's AURA engine listens to the child read aloud and returns WCPM, accuracy, prosody, and miscue analysis — the same metrics DIBELS and mCLASS produce. Imagine doesn't compete in that category.
>
> 2. **Personalized story generation with a character the child knows.** Our Pre-K "Benny the Dog" videos and our K-5 RPG mode adapt in real time to the exact phonemes a child is struggling with. Imagine's 2,500 activities are pre-authored and fixed.
>
> 3. **A parent-adjustable Challenge Meter.** Parents or teachers slide difficulty 1–5 live, with an optional PIN lock. Imagine's difficulty is opaque and system-controlled.
>
> 4. **Setup speed and price.** Imagine is a multi-year district contract. YubiLearn runs an 8-week free pilot with MSA, NY §2-d addendum, and DPA prepared in advance — a classroom is live in a week.
>
> 5. **Reporting principals actually hand to their boards.** Printable 90-day growth reports mapped to CCSS Foundational Reading, plus MTSS Tier 1/2/3 grouping. Imagine's reports are strong but locked inside their portal.
>
> 6. **Coexistence, not replacement.** This is the one that matters most: we are not asking any school to rip out Imagine. YubiLearn runs alongside it, exports to CSV, and produces the oral-reading data Imagine can't. Think of us as a DIBELS/mCLASS-style measurement layer plus a personalized practice layer — not the core curriculum.
>
> **Honest summary.** Imagine is the Coca-Cola of gamified reading practice — you're right. We're not trying to be a bigger Coca-Cola. We're the espresso shot next to it: focused, oral, adaptive, and measurable. In an 8-week pilot on the same students we'll show growth on WCPM and accuracy that their reports don't capture — and we do it without disturbing any existing Imagine contract.
>
> I'll bring a one-page **"YubiLearn vs Imagine — Coexistence Sheet"** to our meeting so you can hand it directly to your literacy coach.
>
> Best,
> Ben

*(~380 words. Plain reply — the one-pager travels in the meeting.)*

---

## Part 2 — Brutally honest audit + only-what's-necessary build list

### Re-audit summary (why the list is short)

Since the Hebrew Public rejection we've shipped: curriculum alignment page, Principal Demo, Pilot Packet (MSA + NY §2-d + DPA), Challenge Meter with PIN lock, AURA oral-reading assessment, teacher retention & progress analytics, Clever SSO, Yubi Village progression, redub/music pipeline with region rescue + delete + level health, two canon Benny videos, COPPA gate, pseudonymized AI, private buckets, MFA on admin routes.

**The three gaps Hebrew Public exposed (curriculum, assessment, teacher dashboards) are closed.** A Bronx charter or Lightbridge/KinderCare director cannot point at a missing product feature. What they can point at is missing paperwork and missing one-pagers.

### Five items — the only things worth adding in the next 2–3 weeks

**1. "YubiLearn vs Imagine — Coexistence Sheet"** — *content, ~1 hour*
One printable page added to `/pilot-packet`. Two-column table, seven rows: oral reading, personalization, parent controls, price, setup speed, reporting, coexistence. Static content only. **Kills the "we already have Imagine" objection in every meeting, not just David's.**

**2. State privacy riders on `/pilot-packet`** — *content, ~2 hours*
Three additional static pages next to the existing NY §2-d: NJ addendum, generic NDPA exhibit, and a plain FERPA/COPPA one-pager for daycare directors. Same page, same styling, no new tables. **Blocks nothing outside NY without this.**

**3. Teacher/Director Quick Start (1-page PDF)** — *content, ~1 hour*
Single page: create account → join code → open Pre-K or RPG → open the growth report. Linked from `/pilot-packet`. No video, no LMS. **Every meeting ends with "how does my teacher start Monday?" — this answers it.**

**4. DIBELS / mCLASS parity strip** — *tiny read-only code, ~2 hours*
Add `src/lib/dibelsParity.ts` mapping AURA WCPM/accuracy bands to DIBELS 8th Edition and mCLASS composite benchmarks. Surface as a small badge on the existing Principal Demo roster and on the growth report. Pure lookup table, zero schema change, zero writes. **This is the "we already have a screener" objection killer.**

**5. 90-Day Growth Report (printable route)** — *small additive route, ~4 hours*
New route `/reports/growth/:classroomId`. Reads existing `reading_sessions` and `student_reading_stats`. Renders WCPM, accuracy, and CCSS-tagged growth over the pilot window. Print stylesheet. Non-teachers see a seeded demo classroom. **Principals ask "what will I get out of 8 weeks?" — this is the answer, printed.**

### Explicitly cut (do not build in this window)

Spanish/Mandarin i18n · placement quiz · offline packs · separate ELL mode toggle · teacher onboarding video · per-curriculum pacing calendars (HMH/CKLA/Fundations) · separate MTSS dashboard route (Principal Demo already tiers) · IEP/504/ELL flag columns · Pre-Reader Tier ages 2–4 (canon Benny already serves this) · deeper Imagine coexistence beyond the one-pager · bulk CSV roster upload (Clever SSO + join codes cover this) · new certificate designs · additional demo routes.

Every one of those was on prior plans. None close a pilot in the next month.

### Ship order (safe, no runtime risk anywhere)

- **Session A (this week):** Items 1 + 2 + 3 — all static content on `/pilot-packet`. You leave the next Bronx meeting with printed handouts.
- **Session B (next week):** Item 4 — DIBELS parity badge on Principal Demo. Read-only lookup.
- **Session C (week after):** Item 5 — 90-Day Growth Report route.

### What we don't touch

Pre-K audio/video pipeline · Challenge Meter core · RPG mode · AURA · Yubi Village · canon Benny videos · timeline mixer · auth flows · RLS · any existing dashboard. Zero edits to working code.

---

**Approve and I start Session A immediately so the coexistence sheet, the state riders, and the Quick Start PDF are printable before your Bronx meetings this week.**
