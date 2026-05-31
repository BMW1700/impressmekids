# Brutally Honest Audit: RPG + Castle Swarm + App Store Readiness

## Short answer

**No — not ready to pivot fully to distribution yet.** The fast-mode reading "fix" we just shipped is *partially* right but still has a timing race that drops word 5 in certain transcripts, and Castle Swarm has several real bugs that will bite on iPad in front of a superintendent. None are catastrophic, all are fixable in one focused pass. Then App Store is mostly paperwork + a few native config changes.

---

## Part 1 — RPG reading (Elara/Cypher fast mode): real bugs still present

Two independent deep audits agree on the same root cause:

1. **`WORD_TRANSITION_ARM_MS = 260ms` outlasts the chain gap.** When the browser delivers all 5 words as one FINAL transcript (fast confident readers), the chained `setTimeout`s for words 2–5 fire *inside* the 260ms arm-blackout from word 4's index advance and are silently dropped by the `isWordTransitioningRef` guard at `RPGWordReader.tsx:862` and `:1041`. This is exactly the "have to repeat the 5th word twice" symptom you keep hitting.
2. **`wordResults` stale-closure in `onBatchComplete`** (`:504-507`, `:640-643`) — when all 5 words land in one render cycle, the parent gets an incomplete results array. Means AURA's per-burst stats can under-count.
3. **`enableEchoRetry={true}` is still on for Elara/Cypher** (`RPGBattleArena.tsx:3157`). Echo retry pauses the mic 1.5s — directly fights fast-mode.
4. **`continue` vs `break` inconsistency** at `:1023` (interim) vs `:857` (final). Interim path can phantom-match a later spoken word against the current target.
5. **`__fastConsumedKey` cursor lives on the recognition object** (`:1015`) and can leak across batches if the mic instance survives.
6. **`isProcessingRef` guard in `scheduleRestart`** (`:943`) creates a ~150ms dead zone where Chrome's `no-speech` can kill the mic permanently mid-breath.

**Verdict: the "applyFastBurst" change helped but didn't fully close the race.** Bugs 1+3 are the ones a fluent kid will actually hit. Must fix before pilot.

---

## Part 2 — Castle Swarm Defense: real bugs

1. **`window.__cs_wave` global never cleaned up on unmount** (`CastleSwarmArena.tsx:267`) — exit mid-run, re-enter, and wave 1 can spawn at late-game speed/HP. Reproducible.
2. **Uncancelled `setTimeout` ghost-fires `startWave` after Exit** (`:580`, `:574`, `:298`) — calls `setWaveHud` on a dead component, throws in React 18 StrictMode.
3. **`hudTick` formula has a dead term** (`:483-484, :600`) — `last = now` runs before the diff, so `now - last` is always 0. Works by accident; will silently break HUD if anyone touches that block.
4. **Dying-enemy filter `hp <= -3`** (`:557`) — a boss hit by `castPower` for exactly 3 damage can linger forever, stalling wave clear.
5. **`window.location.reload()` for Play Again** (`:954`) — white-screen flash on Capacitor/iPad, drops mic permission session.
6. **No iOS safe-area padding on the bottom word-reader panel** (`:880`) — on iPhone/iPad with home indicator, the *primary gameplay control* clips under the system bar.
7. **`BossSpellBreak` RAF restarts on `onResult` ref change** (`BossSpellBreak.tsx:52-68`) — visible countdown glitch mid-encounter.
8. **No `visibilitychange` auto-pause** — iPad split-screen / app switch keeps enemies advancing silently. Teacher horror story.

---

## Part 3 — App Store readiness (Apple guidelines)

Status today:

| Area | State | Action |
|---|---|---|
| **`capacitor.config.ts` `server.url`** | ❌ Points at Lovable sandbox with `cleartext: true` | Must remove the `server` block for any TestFlight/App Store build — Apple will reject cleartext + remote-loaded HTML for a kids app |
| **`NSMicrophoneUsageDescription`** | ❌ Not in repo Info.plist | Required — kid-friendly copy: "NabuLearn listens while you read so AURA can give you instant feedback." |
| **`NSSpeechRecognitionUsageDescription`** | ❌ Missing | Required for Web Speech / on-device recognition |
| **Kids Category compliance (Guideline 1.3 + 5.1.4)** | ⚠ Partial | No third-party analytics/ads sending kid data; verify Sentry is scrubbing PII; no external links out of app without gate |
| **Parental gate for paid/external actions** | ⚠ Need audit | Any "Contact teacher", "Buy", "Open browser" outside child UI must be behind a math-gate when child is signed in |
| **Account deletion in-app (5.1.1(v))** | ✅ Have parent portal | Must also expose it inside the app's settings (not just web) |
| **Sign in with Apple (4.8)** | ❌ Not implemented | Required if any other 3rd-party SSO (Google/Clever) is offered to end-users on iOS |
| **Privacy nutrition label (App Privacy)** | ⚠ Not drafted | Need explicit disclosure of audio recordings, child data, COPPA flow |
| **COPPA consent flow** | ✅ Implemented | Verify it triggers *before* first mic use on iOS, not just at signup |
| **Splash / icons / launch storyboard** | ⚠ Default Capacitor | Need branded 1024×1024 icon + adaptive set |
| **Hot-reload removal verification** | ❌ | Build with `server` block stripped, confirm app loads from `dist/` |
| **Background audio / mic** | ⚠ | Confirm mic stops when app backgrounds (visibility hook above also fixes this) |
| **Network usage transparency** | ✅ | Already over HTTPS Supabase |
| **Encryption export compliance** | ⚠ | Add `ITSAppUsesNonExemptEncryption = false` to Info.plist (uses only standard HTTPS) |

---

## Proposed plan (build mode work, in this order)

### Phase A — Finish RPG reading correctness (one file, ~30 min)
`src/components/aura/game/rpg/RPGWordReader.tsx`:
- Make `WORD_TRANSITION_ARM_MS` mode-aware (80ms in fast mode, 260ms normal).
- Bump fast-mode `FEEDBACK_GAP_MS` to ~250ms so chained words land after both feedback + arm clear.
- Mirror `wordResults` into a `wordResultsRef` and read from ref in `onBatchComplete` (fixes incomplete burst stats).
- Change interim `continue` → `break` at `:1023`.
- Clear `(recognition as any).__fastConsumedKey = null` in `recognition.onstart`.
- Remove `isProcessingRef.current` guard from `scheduleRestart`.

`src/components/aura/game/rpg/RPGBattleArena.tsx`:
- `enableEchoRetry={selectedCharacter !== 'elara' && selectedCharacter !== 'cipher'}`.

### Phase B — Castle Swarm hardening (one file + one component)
`CastleSwarmArena.tsx`:
- Delete `window.__cs_wave` in game-loop cleanup; init inside `startWave`.
- Store all wave/interstitial/spell-break `setTimeout` IDs in refs, cancel on unmount and `endRun`.
- Fix `hudTick` formula (compute elapsed before overwriting `last`).
- Change dying filter to `hp <= 0`.
- Replace `window.location.reload()` with parent-driven remount.
- Add `pb-[env(safe-area-inset-bottom,0px)]` to bottom word-reader panel.
- Add `visibilitychange` auto-pause hook.

`BossSpellBreak.tsx`:
- Use `useRef` for `onResult` so RAF doesn't restart on parent re-render.

### Phase C — App Store native config
- Strip `server` block from `capacitor.config.ts` (or fork to `capacitor.config.production.ts`).
- Add `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `ITSAppUsesNonExemptEncryption=false` documented in repo + setup guide.
- Add an in-app Account Deletion entry under settings linking to the parent portal flow.
- Verify Sign in with Apple is wired alongside Google (already in setup guide) — required by guideline 4.8 since Google SSO is offered.
- Draft App Privacy nutrition label content (markdown doc in repo).
- Replace default Capacitor splash/icons with branded set.
- Add a runtime guard: child accounts must complete parental-consent gate before mic is initialized on iOS.

### Out of scope for this pass
- No new minigames, no world content changes, no UI redesigns, no AURA scoring math changes.
- No removal of the existing applyFastBurst code — Phase A refines it, doesn't replace it.

---

## Verification checklist
- Fluent reader saying 5 words in one breath registers 5/5 with Elara — no repeats — across 10 consecutive trials.
- Slow reader saying words 1-at-a-time with Elara still scores identically to normal mode.
- Castle Swarm: exit mid-wave 3, re-enter, wave 1 spawns at wave-1 difficulty.
- Boss spell break countdown is smooth (no jumps) across full duration.
- iPad Safari + Capacitor: bottom reader panel never clipped by home indicator in portrait or landscape.
- App backgrounded mid-battle → enemies pause; foregrounded → resume.
- iOS production build with `server` block removed launches from `dist/` and asks for mic + speech permission with our copy on first use.
- Account deletion reachable in ≤3 taps from any signed-in screen.
