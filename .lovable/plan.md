
# School-Mode Audit + Contract Requirements — Brutal Truth

## TL;DR

You built an LMS, an SIS, a parent-teacher messaging platform, a school safety/SSVRS platform, a benchmark assessment system, and a district admin console. **Schools don't need any of that from you — they already own PowerSchool, ClassDojo, Raptor, Brightly, and Schoology.** What they actually need from a literacy vendor is paperwork (NDPA), proof of impact (AURA reports), and SSO/rostering. That's it.

**Cut ~85% of school mode. Keep 3 contract-unlocking features. Invest the freed time in paperwork.**

---

## Part 1 — What schools ACTUALLY require for a pilot (web research)

Sources: SDPC National Data Privacy Agreement v2.1, CoSN vendor vetting guide, FERPA Vendor FAQ (US DoE PTAC), Digital Promise Vendor Checklist, K-5 ELA RFPs from Allentown SD, Johnston County NC, Minneapolis Public Schools, Madison Heights MI, LAUSD UDIPP.

### What every district requires (table-stakes, no exceptions)

| Requirement | What it actually is | You have? |
|---|---|---|
| **Signed NDPA v2.1** | The standard data privacy agreement 222K+ schools use via SDPC Resource Registry | ❌ Not yet |
| **FERPA compliance posture** | Vendor FAQ from US DoE PTAC — document how you handle directory info, "school official" exception, deletion | 🟡 Partial (docs/) |
| **COPPA compliance + parental consent flow** | Verifiable consent before any data on under-13 | ✅ You have this |
| **SOC 2 Type I or II OR documented equivalent controls** | At minimum: encrypted at rest + in transit, RBAC, audit logs, breach response plan | 🟡 Partial (docs/soc2/) |
| **Data deletion on contract end + per-student** | Bulk delete + parent request portal | ✅ Done |
| **No selling/sharing/advertising on student data** | Explicit contract clause | ✅ Posture supports this |
| **SSO via Clever, ClassLink, or Google Workspace for Education** | Districts will not roster manually | 🟡 Clever exists, ClassLink missing |
| **Rostering (OneRoster 1.1 or Clever API)** | Auto-create accounts from SIS | 🟡 Clever sync exists |
| **Cybersecurity insurance** | $1M+ aggregate, names district as additional insured | ❌ Insurance question, not code |
| **Subprocessor disclosure** | List of all 3rd parties touching student data | ❌ Need a doc |
| **Hosting region disclosure** | US-only for most US districts; some require state-only | ✅ Lovable Cloud = US |

### What K-5 literacy RFPs specifically require (from real 2024-26 RFPs)

| Requirement | Source RFP | You have? |
|---|---|---|
| Aligned to **Science of Reading** (phonemic awareness, phonics, fluency, vocabulary, comprehension) | Allentown, Montgomery NC, MPS | ✅ AURA does this — but you have a memory rule saying never to USE the phrase. That's a marketing problem, not a product problem. |
| **Universal screener** (DIBELS / Acadience / Aimsweb replacement) | Johnston NC, MPS | ✅ AURA is positioned as this |
| **Progress monitoring** with teacher-facing dashboard | All RFPs | 🟡 AURA Analytics page exists, but locked behind classroom |
| **MTSS / RTI intervention recommendations** | MPS, Allentown | ✅ Q-learning targets phonemes |
| **Parent reports** | Most RFPs | ✅ `parent_phoneme_reports` exists |
| **Offline / iPad support** | All RFPs (1:1 device districts) | ✅ Capacitor iPad shell done |
| **WCAG 2.1 AA accessibility** | All RFPs | 🟡 Mostly there |
| Gradebook / LMS / messaging / attendance / behavior tracking | **NONE OF THEM ASK FOR THIS** | — |

**The brutal finding:** Not a single K-5 literacy RFP I read asks for a gradebook, attendance, behavior tracker, parent-teacher messaging, drill safety, or admin/district console. They ask for a **reading product that produces reports the teacher and parent can read**. You built half of Schoology and none of the schools want it.

### Daycare / Pre-K centers — completely different buyer

- Daycares are licensed by state health/family services, not school districts. No NDPA, no SDPC, no Clever.
- They want **parent-facing app** (which you have via PWA), **simple admin dashboard for 1 director**, **photos/videos of activities**, and **state-funded literacy grants** (Maryland Pre-K Expansion, KY Adaptive Kindergarten Readiness Pilot, MN Access to Tech).
- Pre-K mode (the worlds 101/102/103 Nabu Village system) is already built for this. The school-mode infrastructure helps daycares **zero**.

---

## Part 2 — School-mode codebase audit (brutal verdict, role by role)

Full inventory ran across `src/pages/`, `src/hooks/`, `supabase/functions/`, and the 150+ table schema. File-cited backing detail is captured; this is the summary.

### Teacher role — 15 routes, ~40 tables, ~16 edge functions
**KEEP (game-overlap):** `AuraAnalytics`, `TournamentControl`, `reading-calibration`, `teacher_game_scores`
**CUT:** Everything else. `ClassroomDetail`, `Assignments`, `Questions`, `QuestionGroups`, `StoryManagement`, `ClubDetail`, `StudentProfile` (school version), `Calendar`, `ReviewSubmission` x2, `TeacherPersonalResources`. All classroom/assignment/rubric/standard/behavior/journal/note/summary/substitute/discussion/club/flashcard/benchmark/intervention/risk tables.

### Student role — 11 routes, ~30 tables
**KEEP:** `StudentDashboard` (after surgical split), `AuraPractice`, `games/*`
**CUT:** `CompleteAssignment`, `ReviewMySubmission`, `ReviewMyAnnotations`, `BrowseClubs`, `StudentClubDetail`, `Calendar`, `ClassroomDetail`, `JoinClass`. All assignment/discussion/club/safety-form tables.

### Parent role — 11 routes — THIS IS THE NUANCED ONE
**KEEP (game-mode parent value):**
- AURA progress viewing (`aura_recordings`, `reading_sessions`)
- `parent_phoneme_reports` — emailed phoneme mastery reports
- Child game stats (`campaign_progress`, `player_achievements`, etc.)
- `parent_student_links` approval (gates everything)
- Notification settings + PWA install + data privacy

**CUT (school-mode dead weight on parent):**
- Parent-teacher messaging (`parent_teacher_messages`)
- Meeting bookings (`meeting_bookings`)
- Drill confirmation (`parent_drill_responses`, `drill_attendance`)
- Safety alerts viewing (`ParentSafety` page entirely)
- Reunification QR code (`student_pickups`)
- Gradebook section (`ParentGradebookSection`)
- Classroom announcements feed
- Upcoming school assignments view
- School calendar (`ParentCalendar` page)
- Access request flow (`parent_access_requests`)
- Behavior history view (`ChildDetail` behavior tab)
- School resources links
- Weekly school report

### Admin / District role — 11 routes, ~25 tables, ~13 edge functions
**100% CUT.** Every admin route, every district route, school setup, Clever sync panel, all SSVRS/drill/safety/escalation pages, school settings, district registration, account verification, pending teacher requests.

### Cron jobs
**CUT immediately:** `check-weather-alerts-every-15-min` (96 calls/day to NOAA for school-mode safety alerts, zero game value)
**KEEP:** Daily backup, daily backup cleanup, email queue processor, signin attempts cleanup

### Database triggers
**CUT:** `update_behavior_stats_trigger` on `behavior_records` (materializes school-only stats on every behavior write — burns DB cycles for nobody now)

---

## Part 3 — The 3 school-mode features that DO unlock contracts

Counter to the cut-everything reflex, these three school-mode pieces actually move contracts forward and should stay:

### 1. AURA Analytics teacher dashboard (`/teacher/aura-analytics`)
- The teacher-facing progress dashboard is the **single most-asked-for thing** in every literacy RFP. Without this, you have no answer to "how do teachers see how kids are doing?"
- **Keep, but rework:** decouple it from `classrooms` table. Teachers see students linked via a **lightweight "group" or "license seat" abstraction**, not a full SIS classroom.

### 2. Clever / ClassLink SSO rostering
- District-scale procurement requires this. A pilot at a real K-5 school will fail at IT review if accounts must be created manually.
- **Keep `clever-sync-callback`**, but strip it down to: create `profiles` + a lightweight "license_seat" row. Drop the full classroom hierarchy sync.
- **Add ClassLink** (90 min of work — same OAuth pattern). Most non-Clever districts use ClassLink.

### 3. Universal screener / progress monitoring positioning
- This is not really a feature, it's a **product narrative + 2 simple reports**: (a) a periodic "where is this student" report and (b) a "how is the class trending" report. Both are 100% derivable from AURA data you already collect.
- **Build two clean PDF/email reports** off `aura_recordings` data. This replaces the entire `student_benchmark_results` + `student_interventions` + `student_risk_history` apparatus with something simpler and more rigorous.

Everything else school-mode goes.

---

## Part 4 — The plan

### Phase 0 — You remix (your call, not code)
You remix the current project as `nabulearn-school-archive` if you want a frozen code museum. I cannot do this for you. **My honest take: skip it.** Lovable History tab + git history already preserves every line. A remix gives you a code museum, not a working backup (empty database).

### Phase 1 — Lightweight teacher progress surface (NEW, replaces 80% of school mode)
Build a new minimal teacher entry point that delivers what schools actually want:
- `/teacher/dashboard` (new minimal version) — list of students on this teacher's license, each row showing AURA mastery %, last activity, trend arrow
- `/teacher/student/:id` (new minimal version) — single student AURA detail (phoneme heatmap, recent recordings, trend chart). Reuses existing AURA Analytics components.
- `/teacher/aura-analytics/:groupId?` — **keep**, rework to use license-seat groups instead of classrooms
- New `license_seats` table (replaces `classroom_students`): `id, teacher_id, student_user_id, school_id, status, created_at` + RLS

### Phase 2 — Clever sync simplification + ClassLink
- Rework `clever-sync-callback` to upsert `profiles` + `license_seats` only (drop classroom hierarchy)
- Add `classlink-sync-callback` edge function (same OAuth shape)
- Strip Clever-touched `classrooms`/`classroom_students` writes

### Phase 3 — Stage A cut (reversible — disable, don't drop)
**Database (one migration):**
- Drop `update_behavior_stats_trigger`
- Unschedule the `check-weather-alerts-every-15-min` cron
- Revoke `authenticated` GRANTs on all CUT tables (silently breaks any leftover frontend reads — caught in code review)
- Drop RLS policies on CUT tables (paranoid belt-and-suspenders)
- Leave tables and data intact for now

**Code:**
- Delete 11 admin/district routes + their page files
- Delete 8 teacher school-mode routes + page files
- Delete 8 student school-mode routes + page files
- Delete parent school-mode routes (`ParentCalendar`, `RequestAccess`, `ParentSafety`, parent submission/annotation review)
- Split `StudentDashboard.tsx`: remove `CoursesSection`, `TodaySection`, `ClubsSection`, `CalendarSection`, `AnnouncementsSection`, `GradebookSection`, `SafetySection`, `DirectorySection`, `LinksResourcesSection`
- Split `ParentDashboard.tsx`: remove `ParentGradebookSection`, `ParentAnnouncementsFeed`, `ParentUpcomingAssignments`, school calendar widget
- Split `ChildDetail.tsx`: remove behavior tab + school assignments tab
- Delete the ~80 school-only hooks (assignments, rubrics, behavior, attendance, drill, club, discussion, journal, etc.)
- Delete `App.tsx` route entries
- Delete `CleverSyncPanel.tsx` (replaced in Phase 2)
- Delete ~25 school-mode edge functions (list below)
- Remove school-related guidance from `security--update_memory`

### Phase 4 — Stage B cut (one week later, after Phase 3 ships clean)
- Drop all CUT tables (one migration, ~70 tables)
- Drop unused enum values (assignment_status, rubric_*, etc.)
- Drop unused RLS helper functions (`has_classroom_access`, `is_teacher_of_classroom`, etc.)
- Drop the school-mode-only Postgres functions referenced only by CUT tables
- Final `ANALYZE` + slow-query re-pull

### Phase 5 — Paperwork sprint (parallel to Phase 3-4, mostly your work, I assist with copy)
- Generate a **filled-out NDPA v2.1** with your company details, exhibits A-H. Download template from privacy.a4l.org, I'll draft exhibits.
- Write `SUBPROCESSORS.md` (Lovable Cloud / Supabase, Cloudflare if added, Sentry, Resend or whichever email, OpenAI/Lovable AI gateway)
- Update SOC 2 docs in `docs/soc2/` to reflect post-cut surface area (smaller attack surface = easier audit)
- Add the **Science of Reading** posture page (you have a memory rule against the tagline but RFPs literally use that phrase — we can use the phrase in formal RFP responses without putting badges on the marketing site)
- Write a **2-page pilot one-pager**: what AURA does, evidence, NDPA-ready, COPPA/FERPA posture, pricing $5-7/student/year

### Phase 6 — Daycare / Pre-K parallel track (no extra code needed)
- Pre-K mode is already production-ready. Build a **daycare director one-pager** focused on Pre-K worlds, parent app, photo/video share (already exists in PWA shell)
- Identify 3 state Pre-K literacy grants (Maryland, Kentucky, Minnesota all have active programs)
- This becomes a **second sales channel that does not require any cuts to school mode** — daycares don't care about any of it

---

## What gets cut — file-level (technical section)

**Routes deleted:** all under `/teacher/` except `tournament/control`, `aura-analytics/:id?`, `reading-calibration`, plus a new minimal `dashboard` and `student/:id`. All under `/admin/`, `/district/`, `/district-manager/`, `/school/setup`, `/join-class`. Parent: `/parent/calendar`, `/parent/request-access`, `/parent/safety`, both parent review-submission paths. Student: `/student/assignment/:id`, both review paths, `/student/browse-clubs`, `/student/clubs/:clubId`, `/calendar`, `/classrooms/:id`.

**Tables dropped (Phase 4):** `classrooms`, `classroom_students`, `classroom_features`, `classroom_announcements`, `classroom_syllabus`, `classroom_join_requests`, `classroom_tab_orders`, `assignments`, `assignment_submissions`, `assignment_questions`, `assignment_answers`, `assignment_rubrics`, `assignment_standards`, `assignment_groups`, `assignment_group_members`, `answers`, `attendance_records`, `behavior_records`, `behavior_categories`, `student_behavior_stats`, `teacher_journal_entries`, `teacher_student_notes`, `teacher_summaries`, `teacher_resources`, `teacher_action_log`, `substitute_access_links`, `discussion_topics`, `discussion_posts`, `group_chat_messages`, `clubs`, `club_members`, `club_posts`, `club_join_requests`, `flashcard_sets`, `meeting_bookings`, `parent_teacher_messages`, `parent_consents`, `parent_access_requests`, `parent_drill_responses`, `parent_personal_events`, `parent_student_events`, `pending_teacher_requests`, `school_events`, `school_resources`, `school_settings`, `schools`, `districts`, `district_admins`, `district_managers`, `account_verification_requests`, `safety_alerts`, `safety_alert_acknowledgments`, `safety_audit_log`, `safety_verification_log`, `escalation_rules`, `escalation_notifications`, `reunification_events`, `student_pickups`, `emergency_contacts`, `student_allergies`, `student_medications`, `visitors`, `authority_alert_sources`, `drill_sessions`, `drill_attendance`, `drill_visitor_attendance`, `student_benchmark_results`, `benchmark_assessment_periods`, `student_interventions`, `student_risk_history`, `risk_alert_notifications`, `student_error_patterns`, `learning_standards`, `student_standard_scores`, `rubrics`, `rubric_criteria`, `rubric_levels`, `rubric_scores`, `assignment_standards`, `questions`, `question_groups`, `practice_exercises` *(verify game mode doesn't read this)*, `student_skill_vectors` *(verify)*, `curriculum_anchors`, `tournaments` only if game mode doesn't use *(KEEP — game mode does)*, `tournament_players`, `tournament_questions`.

**Tables kept:** `profiles`, `user_roles`, `parent_accounts`, `parent_student_links`, `parent_notifications`, `parent_notification_preferences`, `parent_stories`, `parent_phoneme_reports`, `student_profiles`, `student_signup_consents`, `student_id_signin_attempts`, `aura_records`, `aura_access_log`, `aura_processing_failures`, `reading_sessions`, `reading_library`, `reading_streaks`, `reading_achievements`, `reading_missions`, `reading_duels`, `reading_gamification`, all `campaign_*`, all `castle_*`, all `player_*`, `multiplayer_rooms`, `match_*`, `boss_rush_attempts`, `daily_login_rewards`, `word_readings`, `student_vocabulary`, `student_q_tables`, `student_reading_progress`, `student_reading_stats`, `text_highlights`, `prek_*`, `world_backgrounds`, `custom_level_stories`, `phonics_foundations_progress`, `ml_model_weights`, `ml_training_jobs`, `realtime_practice_sessions`, `weekly_challenges`, `duel_stats`, `story_votes`, `push_subscriptions`, all email infra (`email_send_log`, `email_send_state`, `email_failures`, `email_unsubscribe_tokens`, `suppressed_emails`, `message_templates`), `data_deletion_requests`, `data_export_requests`, `data_restoration_requests`, `cold_storage_backups`, `backup_audit_log`, `security_audit_log`, `sms_notification_logs`, `app_settings`, `public_profiles`, `phoneme_patterns`. Add new: `license_seats`.

**Edge functions deleted:** `clever-sync-callback` (replaced), `bulk-create-students`, `send-drill-notification`, `send-safety-alert`, `report-emergency`, `escalation-engine`, `check-weather-alerts`, `cleanup-expired-alerts`, `send-substitute-access-email`, `send-risk-alerts`, `send-parent-consent-email`, `send-calendar-notifications`, `generate-teacher-summary`, `generate-question-ai`, `generate-flashcards`, `admin-reset-password`.

**Edge functions added:** `clever-sync-callback` (slimmed), `classlink-sync-callback` (new).

**Cron jobs unscheduled:** `check-weather-alerts-every-15-min`.

**Triggers dropped:** `update_behavior_stats_trigger`.

---

## Expected outcome

| Metric | Before | After |
|---|---|---|
| Tables in schema | ~150 | ~80 |
| Routes in App.tsx | ~80 | ~30 |
| Edge functions | ~60 | ~35 |
| Concurrent users on small instance | ~5-10K | ~10-20K |
| DB baseline CPU/RAM | high (cron + triggers) | -30-45% |
| Time to NDPA-ready pilot pitch | unknown (paperwork blocks) | ~1 week after paperwork sprint |
| Distinct buyer segments | 1 (school district, unfocused) | 2 (K-5 literacy + daycare/Pre-K, both focused) |

---

## Approval needed before I start

1. **Approve the cut scope.** Specifically: do you want me to keep parent-teacher messaging? Meeting bookings? Behavior tracking? Any single one of these I can preserve, but each one re-introduces a non-trivial slice of dead-weight infrastructure. My recommendation is cut all of them.
2. **Approve the new minimal `license_seats` + slim teacher dashboard direction.** This is a real net-new piece of work (~2-3 sessions).
3. **Confirm you want the 2-stage cut** (disable in Phase 3, drop in Phase 4 one week later) rather than rip the bandaid off in one migration. Two-stage is safer; one-stage is faster.
4. **Confirm paperwork sprint scope** — I can draft NDPA exhibits, SUBPROCESSORS.md, FERPA vendor response, and the pilot one-pager. Anything you want excluded?
