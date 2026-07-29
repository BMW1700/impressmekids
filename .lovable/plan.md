## Brutally honest diagnosis

I read `src/lib/speechRecognitionManager.ts` and `src/components/aura/game/rpg/RPGWordReader.tsx`. The mic failure is not random — there are four real defects, and all of them get worse the longer a battle runs.

**1. There are two competing mic owners in RPG mode.**
Every minigame (`RPGQuickBlock`, `RPGFireballDefense`, `RPGBeastSwarm`, `RPGTugOfWar`, ~20 files) goes through the `speechManager` singleton. But `RPGWordReader` — the main reading loop — builds its **own** raw `webkitSpeechRecognition` object (line 1111) and never registers with the manager. So `speechManager.forceStop()` in `RPGBattleArena` physically cannot stop the reader's mic. The reader's auto-restart (`onend → scheduleRestart(100)`) can and does re-open the mic while a minigame is listening. Two live SpeechRecognition sessions on one microphone is exactly what produces the "spazzing/glitching": duplicate transcripts, `audio-capture` / `aborted` error storms, words firing twice or not at all.

**2. A single shared restart timer lets a dead session kill the live one.**
`restartTimeoutRef` is one ref shared by every recognition session. A stale (aborted) session's `onend` fires late, calls `scheduleRestart()`, which **clears the live session's pending restart timer** and installs its own. When that timer runs, the `isCurrentSession()` guard returns early and does nothing. Net result: the real restart was cancelled and no new one was ever scheduled — **the mic silently dies forever** until the user backs out. This is the "after a while it just stops working" bug.

**3. Aborted recognition objects are reused.**
`scheduleRestart` calls `recognition.start()` on the *same* object that was previously `.abort()`ed or errored. Chrome/Safari frequently refuse this with `InvalidStateError`; the catch block sets `isRecognitionStartingRef=false` and **schedules nothing**, so again the mic is permanently dead. A recognition object should be treated as single-use.

**4. No backoff and no watchdog.**
Restarts fire at a flat 100 ms / 300 ms. Chrome rate-limits rapid `start()` calls and its network recognizer degrades after long sessions, so a `network`/`no-speech` storm turns into a hot loop that Chrome eventually stops serving. Nothing anywhere notices "we're supposed to be listening but nothing has run for 4 seconds." Tab backgrounding / iOS audio interruption also kills the session with no recovery path.

The manager has the same class of bug on its web path: `onend` restarts `this.recognition`, which by then may be a *different* owner's newer instance, and handlers are never detached.

## The fix

**A. One mic owner, enforced**
- Register `RPGWordReader` with `speechManager` as owner `'reader'` (claim on start, release on stop/unmount) so the singleton is the single source of truth. Minigame `start()` calls will now correctly force-stop the reader instead of racing it.
- `RPGBattleArena` keeps calling `forceStop()` on transitions; it will now actually stop the reader.

**B. Session-scoped lifecycle in `RPGWordReader`**
- Replace the shared `restartTimeoutRef` with a **per-session timer** stored on the session object, so a stale session can never cancel the live session's restart.
- Build a **fresh `SpeechRecognition` instance on every restart** instead of reusing an aborted one.
- Detach `onstart/onresult/onerror/onend` (set to `null`) on every teardown so dead objects go fully inert.

**C. Backoff + watchdog**
- Exponential backoff on consecutive failures (150ms → 300 → 600 → 1200, capped ~2.5s), reset on any successful `onstart` or result.
- A **watchdog heartbeat** (~3s interval): if `shouldBeListening` is true but nothing has started or produced a result within the window, tear the session down and cold-restart it. This is the safety net that guarantees the mic can never stay dead.
- On `visibilitychange` back to visible (and on Capacitor `resume`), force a cold restart.
- Surface a small "Mic reconnecting…" state in the reader UI instead of a frozen "Listening…" chip so kids/teachers see recovery instead of a dead button.

**D. Harden `speechRecognitionManager`**
- Per-instance identity guard: `onend`/`onerror` handlers only act if `this.recognition === theirOwnInstance`.
- Fresh instance per restart, handlers nulled on stop/abort/forceStop.
- Same backoff + watchdog as the reader so minigames get the same guarantee.
- Fire `onEnd` before clearing `config` in `stop()` so owners aren't left hanging.

## Technical notes
Files touched: `src/lib/speechRecognitionManager.ts`, `src/components/aura/game/rpg/RPGWordReader.tsx`, plus a small shared helper `src/lib/speech/micWatchdog.ts` for the backoff/heartbeat logic reused by both. No database, no edge functions, no changes to matching strictness (`wordMatchingModes.ts` / Challenge Meter behavior is untouched). Native (Capacitor) path is left behaviorally identical apart from getting the same watchdog restart.

## Verification
Instrumented console logging with a session id + owner on every start/stop/restart, then a long-run RPG battle in the preview browser to confirm: only one owner is ever active, no `InvalidStateError` loops, and the watchdog recovers the mic after a forced kill.
