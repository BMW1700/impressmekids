
# YubiLearn Master Plan — Bronx K-2 Pilot Sprint — v5 FINAL (Post-Audit)

## Brutal-honesty audit results — what we ALREADY have

**Don't rebuild — already 80%+ done:**
- ✅ **Pre-K video upload** (`preKVideoUpload.ts`, `PreKLevelBuilder`, `PreKWorldsList`) — single-file upload works. Only missing = bulk drag-drop.
- ✅ **Auto-duration probing** (`preKVideoDurationProbe.ts`) — fully wired, auto-backfills DB. Reuse as-is.
- ✅ **Universal screener BOY/MOY/EOY** (`useBenchmarkData`, `ClassroomScreeningDashboard`, `benchmark_assessment_periods` + `student_benchmark_results` tables) — ~90% done. Just needs label verification.
- ✅ **Scope & Sequence page + PDF export** (`ScopeAndSequence.tsx`, `scopeSequencePdf.ts`) — public route lives, CCSS/Wilson/UFLI mapped. Extend, don't recreate.
- ✅ **Interventions backend** (`useInterventions`, `student_interventions` table, `InterventionTracker`) — full plumbing exists. Only UI/tier-grouping is missing.
- ✅ **Pre-K word banks** (`preKWordBanks.ts` 73 lines) — categories exist as hardcoded arrays. Need DB migration + phoneme tags, not a from-scratch build.
- ✅ **Legal docs** (`CONTRACT_READINESS.md`, `docs/soc2/*`) — content written. Just needs packaging into a route.

**Genuinely missing — build from scratch:**
- ❌ Deprecation flag on old Pre-K content
- ❌ Challenge Meter (1–5 speech strictness dial + parent/teacher UI + phonemeInference wiring)
- ❌ Principal demo route with seeded 6-week growth data
- ❌ `/for-principals` landing page
- ❌ `/pilot-packet` route packaging existing legal docs + `pilot_agreements` table
- ❌ Teacher training video + laminated PDF (content, not code)
- ❌ Multi-state approval workflow (currently just `is_published` boolean)

---

## You produce 30 Pre-K videos (unchanged from v4)

Same 30-video split — 16 categories + 3 charter-critical additions (Sight Words / Letters & Sounds / Rhyming). New videos go through existing `PreKLevelBuilder` upload flow. No changes to your production workflow.

---

## What I build — only the deltas

### Track A — Pre-K video infrastructure improvements (not rebuilds)

**A1. Bulk drop-zone wrapper around existing uploader**
- New component `<PreKBulkVideoDropzone>` that accepts multiple MP4s + auto-parses filename (e.g. `W101-L1-opening.mp4`) to route each file into the existing `uploadPreKVideo()` function.
- No changes to the upload primitive itself.

**A2. Extend word taxonomy in DB (migration, not new system)**
- Migration: add `phoneme_tags text[]`, `curriculum_tags jsonb` (`{fundations_unit, ckla_domain, hmh_unit, el_module, ww_module}`), `category text`, `category_level int` to `prek_level_words`.
- Seed script converts existing `preKWordBanks.ts` arrays + your 30-video word list into rows.

**A3. Multi-state approval on `prek_levels`**
- Migration: `status enum('draft','ready_for_review','approved','deprecated')` replacing single `is_published` boolean (keep the boolean for back-compat + write a computed migration).
- Simple approval queue view at `/superadmin/content-review` — lists levels in `ready_for_review`, click Approve → `approved` + `is_published=true`.

**A4. Deprecation flag on old Pre-K content**
- Uses the `deprecated` status from A3. One-click "Deprecate all old branded-pennant levels" utility button in super-admin. Deprecated content stays playing for existing students but hides from new signups.

### Track B — Curriculum alignment (extend existing surface)

**B1. Extend `PhonicsStage` type + `phonicsScopeAndSequence.ts`**
- Add columns: `hmh_into_reading_unit`, `el_ed_module`, `wit_wisdom_module`, `ckla_domain`, `fundations_unit`.
- No new page — the existing `/scope-and-sequence` route + PDF export inherits automatically.

**B2. New public page `/curriculum-alignment`**
- School picks curriculum → downloads 1-page PDF crosswalk (reuses `scopeSequencePdf.ts` pattern).
- 5 alignment PDFs: HMH Into Reading K/1, EL K/1, W&W, CKLA Skills K, Fundations K.

### Track C — Teacher / Principal surfaces (fill UI gaps only)

**C1. MTSS Tier-2 group card on `TeacherDashboard`**
- New card component reading from existing `useInterventions` + `student_interventions` + `student_risk_history` (all already there).
- Adds tier-grouping logic (Tier 1/2/3 based on risk score) + printable layout. Pure UI.

**C2. Principal demo route `/demos/principal`**
- Extends existing `Demos.tsx` (which already has Student/Teacher/Parent/Admin/RPG demos).
- New seeded demo classroom "Ms. Rivera's K" with 18 fake students, 6 weeks of `student_benchmark_results` + `phonics_foundations_progress` rows.
- Add `is_demo boolean` column to `classrooms` for filterability.

**C3. `/for-principals` landing page**
- New public route. Positions the pilot offer, links to `/curriculum-alignment`, `/demos/principal`, `/pilot-packet`.

### Track D — Challenge Meter (all new)

**D1. Schema + settings hook**
- New table `challenge_settings` (per-student, parent-owned, teacher-overridable). Columns: `level int 1..5`, `set_by user_id`, `overridden_by_teacher bool`.
- Migration includes GRANTs + RLS.

**D2. Wire into `phonemeInference.ts`**
- Level 1–5 maps to Levenshtein tolerance + phoneme-substitution acceptance thresholds already in that library. No new matching engine.

**D3. Parent UI `/parent/settings/challenge` + teacher override on student profile**
- Simple slider + preview button.

### Track E — Pilot packet (packaging, not new content)

**E1. New table `pilot_agreements`** (school_id, status, signed_date, msa_url, dpa_url, ny_2d_addendum_url).

**E2. Public route `/pilot-packet`**
- Renders existing markdown from `CONTRACT_READINESS.md` + `docs/soc2/*` as downloadable PDFs.
- Adds NY Ed Law §2-d addendum template (net-new content — 1 doc).
- Downloadable 8-week free MSA (net-new content — 1 doc).

### Track F — Content deliverables (write-ups, not code)

- F1. Teacher training video script + you record 15 min
- F2. 1-page laminated quick-start PDF (design in code, print externally)
- F3. NY Ed Law §2-d addendum doc
- F4. 8-week free pilot MSA doc

---

## 3-week schedule (revised, tighter because less to build)

**Week 1 — DB + infra deltas**
1. Word taxonomy migration (A2)
2. Approval workflow migration (A3) + deprecation flag (A4)
3. Bulk drop-zone wrapper (A1)
4. Extend `phonicsScopeAndSequence.ts` with HMH/EL/W&W/CKLA/Fundations (B1)
5. `challenge_settings` table + RLS (D1)
6. `pilot_agreements` table + RLS (E1)

**Week 2 — UI surfaces**
7. `/curriculum-alignment` + 5 alignment PDFs (B2)
8. MTSS Tier-2 card on TeacherDashboard (C1)
9. Challenge Meter parent + teacher UI + phonemeInference wiring (D2, D3)
10. `/pilot-packet` route (E2)
11. NY §2-d addendum + MSA docs written (F3, F4)
12. **You start uploading videos 1–10 via new bulk dropzone**

**Week 3 — Demo + landing + polish**
13. Seeded demo data + `/demos/principal` route (C2)
14. `/for-principals` landing page (C3)
15. Teacher training video + laminated PDF (F1, F2)
16. **You finish uploading videos 11–30**
17. End-to-end walkthrough

---

## Two confirmations before I start (unchanged)
- Voice for new videos: same ElevenLabs Benny. ✅ assumed yes.
- Story arc: 30 independent adventures. ✅ assumed yes.

## Definition of done (unchanged)
Walk into a Bronx K-2 charter and: show alignment PDF, run principal demo, hand over pilot packet + §2-d addendum, show 30 Pre-K videos + Challenge Meter, sign 8-week MSA.

**Approve v5 and I start with the Week 1 migrations.**
