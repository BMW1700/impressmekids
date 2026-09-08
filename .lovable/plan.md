# Master Plan v13 — Pilot-Ready Foundational Literacy Platform

Two asks are folded together: the small scroll-background fix you reported, and the full "Ultimate Master Build" transformation. Work runs in the order below; nothing existing is removed unless it directly conflicts.

## Phase 0 — Scroll background fix (immediate)

Verified state: on the Pre-K world map and the Village, Sir Bookears **and** the bedroom background are both coded as fixed-to-viewport. The background image should already stay pinned exactly like Benny does, so something is breaking that on your screen (most likely an ancestor wrapper with a transform/overflow that cancels the pinning for the image layer, or a different page than the world map).

- Reproduce in the live preview at desktop width, scroll, and confirm which page and which layer drifts.
- Fix the offending wrapper so the background pins identically to Benny (no parallax, no drift), on all Pre-K screens that use the bedroom background.
- Re-check the Village and the world map after the fix.

## Phase 1 — Foundation (audit + hierarchy)

What already exists and stays: Auth + centralized AuthContext, roles table (`user_roles` with admin, teacher, student, parent, district_manager, game_player, super_admin), districts -> schools -> classrooms -> teachers -> students, 190+ tables with RLS, teacher/parent/admin/district/super-admin dashboards, Demos pages, Pilot Packet pages, Scope & Sequence page, Pre-K DB-driven CMS (`prek_worlds`, `prek_levels`), `pilot_agreements`, `phonics_foundations_progress`, `curriculum_anchors`, `student_skill_vectors`, `student_interventions`.

Build:
- Map spec roles onto existing ones (Organization = district, Site = school, Educator = teacher, Site Admin = admin, Org Admin = district_admin). Add two new roles: `reviewer` and `content_reviewer`; keep the single-role-per-user rule.
- Organization/site switching, invitation links, archive/transfer flows for classes and students, audit log entries for these actions.
- Shared design tokens split into Child theme (warm, illustrated) and Educator theme (calm, spacious) under one brand.
- Fix broken/inconsistent navigation; define the per-role primary nav from section 24.

## Phase 2 — Instructional architecture

- New `skills` + `skill_prerequisites` + `lessons` tables covering the 8 stages (Readiness -> Alphabet A–Z -> Phonological/Phonemic -> Letter-Sound -> Decoding -> Vocabulary -> Sentences -> Fluency/Comprehension). Existing `phonicsScopeAndSequence` and Pre-K levels are linked in, not duplicated.
- Complete A–Z letter lessons as records (upper/lower, name, sound, examples, guided, independent, mastery check).
- `student_skill_mastery` with configurable thresholds (advance / supported retry / prerequisite fallback / educator alert). Gentle feedback copy only.
- Visual skill map component (completed, current, in progress, needs practice, locked, teacher-assigned).

## Phase 3 — Student experience

- Adaptive placement adventure (short, skippable/overridable by educator, labeled as a recommendation).
- Adventure map tying worlds to stages; lesson flow with guided -> practice -> mastery check -> feedback.
- Accessibility controls that work in core flows: reduced motion, volume, replay, captions, text size, keyboard nav, non-mic alternatives, large targets.
- Rewards limited to badges, stars, world unlocks, mascot celebrations, printable achievements. No public rankings, no punishing streak loss.
- Diverse cast in new illustrations/names/stories; optional simple guide choice.

## Phase 4 — Educator experience

- First-login onboarding wizard (pause/resume) ending in a readiness checklist.
- Dashboard answering: who used it, who is progressing, who is struggling, which skills, who hasn't started, what to do next. Every metric labeled + explained + actionable.
- Student detail page with mastery, accuracy/fluency/WCPM history, notes, interventions, exportable summary.
- Skill assignments and prerequisite assignment from the struggling-learner view.

## Phase 5 — Professional Development + Support

- Training Center with the 7 modules (written + visual, short knowledge checks, completion records, printable quick-start, session checklist, FAQ). Admin view of who completed onboarding.
- Support Center: searchable articles, role FAQs, device-readiness guide, ticket form with category/severity/site context and status.
- Device-readiness test (browser, screen, audio, optional mic, connectivity, storage, video).

## Phase 6 — Organization + Pilot management

- Org dashboard: sites, educators, students, active learners, onboarding, sessions/learner, skill progression, readiness, filters (site/class/date/stage/skill/educator/cohort). Aggregated, privacy-safe.
- Pilot Center: configurable pilots (no hard-coded site count/duration), per-site readiness checklist, progress dashboard, baseline/post-pilot collection, evaluation views that never state causation.
- Structured feedback (educator + reviewer) attachable to lesson/activity/dashboard/training/platform, with internal review dashboard (status, category, priority, owner, resolution).
- Reviewer role: guided demo environment, sample lessons, simulated dashboard, feedback form, zero real student data.

## Phase 7 — Content operations

- Extend the Pre-K CMS into a general lesson CMS with the section-18 fields and the workflow Draft -> Educational Review -> Accessibility Review -> Approved -> Published -> Archived, with content permissions and version history.

## Phase 8 — QA + Demo

- Guided Demo Mode ("Start Guided Demo") on clearly labeled fictional data, isolated from production.
- Analytics event utility with the section-28 event names.
- Intentional loading/empty/error/offline/permission states on every major screen.
- Run all five end-to-end scenarios (student, educator, organization, pilot, reviewer) via browser automation, plus tablet/Chromebook widths.
- Remove unsupported claims (no "proven", "clinically tested", compliance guarantees) across marketing and in-app copy; existing "AI-Powered Literacy" branding stays.

## Technical notes

- Stack unchanged: React 18 / Vite / Tailwind / Lovable Cloud. All new tables get GRANTs + RLS in the same migration; roles stay in `user_roles`.
- New tables (approx.): `organizations` views over districts/schools where possible, `skills`, `skill_prerequisites`, `lessons`, `lesson_versions`, `student_skill_mastery`, `placement_sessions`, `training_modules`, `training_progress`, `support_tickets`, `help_articles`, `device_checks`, `pilots`, `pilot_sites`, `pilot_readiness_items`, `pilot_measurements`, `feedback_submissions`, `analytics_events`, `admin_audit_log` (reuse `security_audit_log` where it fits).
- Demo data lives behind an `is_demo` flag and a separate seeded org; never mixed with real rows.
- Each phase ships independently and is verified (build log, targeted browser tests) before the next starts.
- A `roadmap.md` at project root will track every phase and open item once building begins.

## Open items needing your input

- Phase 0: if the drifting background is not the Pre-K world map or the Village, tell me which screen.
- Product name: the app is currently branded "Yubi Learn" / yubilearn.com; the prompt says "UBLearn". I will keep Yubi Learn unless you say otherwise.
