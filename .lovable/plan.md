# Audit result — 3 real risks left

## ✅ Verified clean this pass
- Atomic JSONB merge RPC in use on all three path maps (no lost-update race).
- Partial unique indexes enforce one redub + one music clip per scene.
- Track upserts idempotent (`ignoreDuplicates: true`) — parallel workers safe.
- Redub split into `isolate` → `sts` phases; each stays well under 150s.
- LALAL polling capped at 90s per invocation, client resumes with `resumeJobId` up to 10min.
- Music clip `pause_on_word_card = false`; redub `pause_on_word_card = true`; source video auto-mutes.
- CORS unified, R2 mirror fire-and-forget, timestamped paths bust CDN cache.

---

## 🔴 Risk 1 — 429 rate limits burn the whole scene
`fetchWithRetry` retries only on 5xx + network. **ElevenLabs and LALAL return 429 when concurrency caps or per-minute quotas trip.** With `CONCURRENCY=3` in Full Auto, each scene fires 2 ElevenLabs requests (isolate + STS) plus 1 LALAL — 3 workers × 3 calls = up to 9 in flight. ElevenLabs Creator tier concurrency is 5; you'll clip 429s on longer levels and the whole scene fails.

**Fix:** in both edge functions, treat 429 as retryable in `fetchWithRetry`, with exponential backoff honoring `Retry-After` when present. Bump attempts to 4 for 429 specifically.

## 🔴 Risk 2 — Retrying a failed STS re-pays for isolation
If Phase A (isolate) succeeds and Phase B (STS) fails — network blip, 429, voice ID typo — the client re-runs `redubScene` and re-uploads to `/audio-isolation`, burning ElevenLabs credits for a stem you already have durably in storage.

**Fix:** in `useBennyRedub.redubScene`, before running Phase A, check `settings.isolatedPaths[sceneKey]`. If present, skip Phase A and go straight to Phase B with the existing `isolatedStoragePath`. A new `forceReisolate` override lets the studio panel force a fresh isolation when a user genuinely wants it.

## 🟡 Risk 3 — Full Auto shows stale error states
`runFullAuto` doesn't reset `states` / `musicStates` at the start. A scene that failed last run still shows red "error" while its worker is queued but hasn't started yet, and the retry path in Risk 2 kicks in only after the worker picks it up. Cosmetic but confusing during multi-minute runs.

**Fix:** at the top of `runFullAuto`, reset each scene's slot to `{ status: "idle" }` for both maps before workers start.

---

## What ships on approval
1. **`supabase/functions/_shared/cors.ts` neighbor** — no change; keep as-is.
2. **`prek-clip-redub/index.ts`** — extend `fetchWithRetry` to retry 429 with `Retry-After` backoff (cap 15s per wait, 4 attempts). Same helper used by isolation, STS, LALAL calls.
3. **`prek-clip-music-extract/index.ts`** — same `fetchWithRetry` upgrade for upload/split/check/stem-download.
4. **`useBennyRedub.ts`**:
   - `redubScene`: if `isolate` and `settings.isolatedPaths[sceneKey]` already set, skip Phase A and reuse the stored `isolatedStoragePath` for Phase B. Add `overrides.forceReisolate` to bypass.
   - `runFullAuto`: reset per-scene `states` + `musicStates` to `idle` before dispatching workers.
5. **Redeploy** both edge functions.

No DB migration. No UI schema change. After this, Full Auto is resilient to rate limits, cheap to retry after partial failure, and visually accurate mid-run.
