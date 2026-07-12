## Goal
Guarantee that a single "Prewarm all" click produces a fully isolated, multilingual_v2, correctly-cached MP3 for every word and every phonics segment — no silent fallbacks, no tab-death, no wasted round-trips.

## Fix 1 — Fail loud if isolation isn't available (critical)
`supabase/functions/prek-word-tts/index.ts`
- Add a preflight `POST /v1/audio-isolation` probe at server start (cached in a module-level `let isolationVerified: boolean | null`).
- New request field `requireIsolation: boolean` (default **true** for prewarm, false for on-demand game calls).
- When `requireIsolation === true` and isolation returns non-2xx OR falls back, respond `502 { error: "isolation_unavailable", details }` **instead of silently shipping raw bytes**. The prewarm UI marks that row `error` with the real reason so you know before playing 800 files.
- Keep the graceful-fallback path for live game calls so a child never hears silence if isolation is briefly down.

## Fix 2 — Keep the run alive & make cancel work
`src/pages/superadmin/BennyVoicePrewarm.tsx`
- Request `navigator.wakeLock.request("screen")` when prewarm starts, release on finish/error. Prevents laptop-sleep from killing the run.
- Replace the broken `cancelFlag` state read inside workers with a `useRef<boolean>` so Cancel actually stops the loop.
- Persist queue progress to `localStorage` after each job so a hard tab crash can be resumed from the same row instead of restarting.
- Show live "isolated ✓" badge per row (from function response) so you can see mid-run that isolation is actually running.

## Fix 3 — Stop re-enqueuing cached segments
`src/pages/superadmin/BennyVoicePrewarm.tsx`
- Reuse the on-load storage probe (`segByKind` sets) as the source of truth for which segments to enqueue.
- Enqueue only `plan entries where !segByKind[kind].has(slug)` (or all of them when `force` is on).
- Correct `segDone` seeding so progress %, totals, and "done" match reality.

## Fix 4 — Verify with a smoke test after purge → prewarm
Add a "Verify 5 random files" button that:
- Picks 5 words + 5 random segments from cache.
- Downloads each MP3, checks `Content-Length > 4 KB` (isolation strips silence so tiny files = broken) and plays them back-to-back.
- Reports pass/fail per file. This is the empirical proof that the run actually worked before you approve for kids.

## Order of operations after build
1. Nuke poisoned cache.
2. Click "Prewarm all" (wake-lock engages, tab can stay backgrounded but not slept).
3. Let it run — if isolation scope is missing, it fails on file #1 with a clear message instead of poisoning 800 files.
4. When it finishes, hit "Verify 5 random files."
5. Test `hear` + `teach` in the live game.

## What this does NOT change
- ElevenLabs credits usage (same or lower — we stop re-hitting cached segments).
- The redub studio pipeline (already routes through the same isolation, unaffected).
- Game-side `bennyVoice.ts` / `bennyTeach.ts` (they already read from the edge function; no client changes needed).

## Straight answer to your question
As it stands right now: **No, I cannot guarantee it will be perfect** — because of the silent isolation fallback. After these four fixes: **yes**, because the run will either produce fully isolated multilingual_v2 audio for every file, or fail loudly on file #1 with the exact reason. No middle ground, no surprise garbage in the cache.
