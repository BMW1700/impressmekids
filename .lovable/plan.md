# Post-Publish Audit — Brutally Honest

## Verdict
**Cutover is real but not 100%.** The high-volume path (student pre-K video/audio playback) is fully on R2. Four call sites still hit Supabase Storage on migrated buckets. Cost-at-scale claim is TRUE for ~95% of egress, FALSE as an absolute.

## Facts

**Confirmed working (production, live audit):**
- `VITE_USE_R2_CDN="true"` set in `.env`.
- `cdn.nabulearn.com` returns 200 on real objects (verified prior turn).
- Six buckets flagged R2-enabled in `src/lib/cdn.ts`: `prek-level-videos`, `prek-level-audio`, `world-backgrounds`, `campaign-assets`, `avatars`, `email-assets`.
- Student player: 0 Supabase signed-URL calls (verified last turn).
- Super-admin PreKLevelBuilder: 0 Supabase signed-URL calls after last fix (verified last turn).
- R2 bucket: 1000/1000 files copied, 0 failures.

**Residual Supabase-egress leaks (unrewritten `getPublicUrl` on migrated buckets):**

| File | Bucket | Impact |
|---|---|---|
| `src/components/student/sections/AccountSection.tsx:374` | `avatars` | Every student avatar upload/render → Supabase URL |
| `src/components/aura/game/CampaignModeEntry.tsx:79` | `campaign-assets` | Every campaign entry screen (high traffic) |
| `src/components/aura/game/CampaignVideoGate.tsx:175` | `campaign-assets` | Every campaign video gate render |
| `src/components/aura/game/CampaignAssetUploader.tsx:108` | `campaign-assets` | Admin uploads only (low volume) |

These return `sjigkjwkgovculkovcjy.supabase.co/storage/v1/object/public/...` URLs. Browsers hit Supabase directly, not R2. Supabase egress accrues.

**Not leaks (correct behavior):**
- `useClassroomSyllabus.ts`, `QuestionAnswerForm.tsx`, `StudentQuestionView.tsx`, `useAudioRecorder.ts`, `WordByWordReader.tsx`, `AudioPlaybackButton.tsx`, `TeacherWordVerification.tsx`, `preKAuraSubmit.ts` → private buckets (`aura-audio`, `assignment-*`, `classroom-syllabus`) intentionally excluded from R2 (FERPA/private).
- Upload code paths (`.from(X).upload(...)`) don't cause egress.

## Cost at Scale — Straight Answer

**Cannot give you a hard number without leak closure + 48h of production metrics.** What I can commit to:

- **Pre-K video/audio (the whale, ~90% of prior egress):** now $0 Supabase egress. Served from R2 → Cloudflare CDN. Egress from R2 to end user = **$0/GB** (Cloudflare bandwidth alliance). R2 storage ≈ $0.015/GB/mo. Class A operations $4.50/M, Class B $0.36/M.
- **Campaign assets + avatars (residual leaks above):** still on Supabase Storage at **$0.09/GB egress**. Volume depends on active campaign users × asset size. Non-zero. Will show up in your bill.
- **Private buckets (aura-audio recordings, assignment media):** never migrated by design. Supabase egress applies. Same as before cutover.

Bottom line: **big cost reduction is real. "Zero Supabase egress" is not, until the four leaks are patched.** Anyone telling you 100% cutover right now is lying.

## Plan to Close the Gap

1. **Patch 4 leak sites** — wrap each `getPublicUrl` call with `getCdnUrl(bucket, path)` short-circuit (same pattern already applied to `PreKLevelBuilder.tsx`). Files:
   - `src/components/student/sections/AccountSection.tsx`
   - `src/components/aura/game/CampaignModeEntry.tsx`
   - `src/components/aura/game/CampaignVideoGate.tsx`
   - `src/components/aura/game/CampaignAssetUploader.tsx`
2. **Add lint guard** — grep-based pre-commit check that flags `supabase.storage.from('<migrated-bucket>').getPublicUrl` without a `getCdnUrl` companion. Prevents regression.
3. **Republish** and re-run authed Playwright sweep on `/student/dashboard` (avatar), `/games/aura/campaign` (campaign entry + video gate). Confirm Network tab shows 0 requests to `*.supabase.co/storage` for those buckets.
4. **48h metrics pull** — after leak closure, compare Supabase egress dashboard vs pre-cutover baseline and R2 request count. Only then can I quote you a real $/month at your current traffic.

Approve and I'll execute all four patches + verification in one pass.
