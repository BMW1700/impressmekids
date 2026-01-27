
<context>
User-reported behavior (verified via screenshot):
- “All words read!” banner shows (so `allWordsRead === true` in the UI layer), but victory/defeat screen never appears.
- Enemy HP visually reaches 0 (dragon shows 0/280), but victory screen never appears.

What this implies:
- Our “trigger victory/defeat” conditions are either:
  1) never firing, or
  2) firing but getting immediately overwritten by another `setPhase('reading')`/`setPhase('combat')`/etc. from pending timeouts/callbacks.

Based on the current code in `RPGBattleArena.tsx`, #2 is the most likely cause.
</context>

<what-i-found (from code inspection)>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

1) Victory/defeat triggers exist (good), but they are not “sticky”:
- There is a useEffect that correctly says:
  - if `enemyHp <= 0` => victory (or enemy_transition)
  - if `allWordsRead` => victory if accuracy>=0.8 else defeat
- There’s also the multi-enemy transition useEffect (enemyHp<=0) that sets victory/transition.

2) There are multiple unguarded places that set `phase` later via timeouts:
Examples:
- `returnToReading()` always schedules a `setTimeout(() => setPhase('reading'), 100)` and does NOT check if phase has since become `victory/defeat`.
- Enemy-turn logic sets phase back to reading after 600ms.
- There is a 6-second failsafe that sets phase back to reading.
These can override victory/defeat that was set earlier.

This exactly matches what you’re seeing:
- Enemy HP hits 0 → victory briefly set → a pending timeout fires → phase returns to reading, so you never see the victory popup.
- All words read with >=80% → victory should set → another pending timeout overwrites it → you remain in the “All words read!” message state.
</what-i-found>

<goal>
Make victory/defeat terminal states that cannot be overwritten by any delayed callback or timeout, and ensure BOTH game-over pathways are bulletproof:
1) End-of-reading:
   - all words read AND accuracy >= 0.8 → VICTORY screen must show
   - all words read AND accuracy < 0.8 → DEFEAT (“Try Again”) must show
2) Enemy death:
   - enemy HP <= 0 from ANY source (normal reading attacks, powers, or mini-game damage) → VICTORY must show immediately
   - If multi-enemy queue and not final enemy → enemy_transition, then continue
</goal>

<implementation-plan>
<step 1 — Add “terminal-state safety” infrastructure (prevents phase being overwritten)>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

1. Add `phaseRef`:
- `const phaseRef = useRef<BattlePhase>(phase);`
- `useEffect(() => { phaseRef.current = phase; }, [phase]);`

2. Create a single helper to change phases safely:
- `const setPhaseSafe = useCallback((next: BattlePhase, reason?: string) => { ... })`
Rules:
- If `phaseRef.current` is `victory` or `defeat`, do nothing (terminal).
- If `phaseRef.current` is `enemy_transition`, only allow transition-specific changes (or keep strict).
- Otherwise set phase and optionally log.

3. Replace direct calls to `setPhase('reading')`, `setPhase('combat')`, etc. inside timeouts/callbacks with `setPhaseSafe(...)`.

Why this matters:
- Even if victory is correctly triggered, no delayed callback can drag the app back into reading/combat.

</step 1>

<step 2 — Track and cancel pending timeouts on terminal transitions (hardening)>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

1. Create a small timeout registry:
- `const timeoutsRef = useRef<number[]>([]);`
- Helper `scheduleTimeout(fn, ms)` that stores id in `timeoutsRef.current`.
- Helper `clearAllTimeouts()` that clears and empties.

2. On entering terminal states (`victory` or `defeat`):
- Call `clearAllTimeouts()`.
- Force-stop speech recognition (`speechManager.forceStop()`), because lingering recognition can also retrigger logic and queue more state updates.

3. Replace existing `setTimeout(...)` calls in the file with `scheduleTimeout(...)`.
Key locations to convert:
- `returnToReading()` 100ms reset
- enemy turn completion (600ms)
- 6-second failsafe
- any combat animation cleanup timeouts that can set phase later

This ensures:
- There is no delayed “reading reset” still waiting in the event loop once victory is reached.

</step 2>

<step 3 — Centralize game-over triggering in two explicit functions (single source of truth)>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

Create:
- `triggerVictory(reason: string)`:
  - if already terminal, return
  - `clearAllTimeouts()`
  - `speechManager.forceStop()`
  - `setPhaseSafe('victory', reason)`
- `triggerDefeat(reason: string)` similarly.

Replace scattered `setPhase('victory')` and `setPhase('defeat')` calls with these functions where appropriate:
- Enemy HP transition useEffect
- allWordsRead accuracy useEffect
- `returnToReading()` early-return branch when enemyHpRef<=0

This removes “some code sets victory, other code sets reading” fights.

</step 3>

<step 4 — Fix enemy death detection to be robust against stale closures>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

You already have `enemyHpRef` which is good, but the key is to ensure:
- All mini-game completion handlers compute new HP using `enemyHpRef.current` and update `enemyHpRef.current = newHp` before calling `returnToReading()`.
- Then `returnToReading()` should call `triggerVictory`/`setPhaseSafe` and must NOT schedule reading reset if terminal.

Also update the “enemyHp<=0” useEffects to call `triggerVictory`/transition using the safest available value:
- Keep `enemyHp` in the dependency list (React state drives UI), but use `enemyHp <= 0` and/or `enemyHpRef.current <= 0` inside to protect against timing.

</step 4>

<step 5 — Make the “all words read” condition trigger a terminal state reliably>
File: `src/components/aura/game/rpg/RPGBattleArena.tsx`

1. Ensure the all-words-read useEffect uses `triggerVictory/triggerDefeat`.
2. Confirm accuracy calculation matches your rules:
- `currentAccuracy = correctWords / wordsRead`
- Since we added immediate miss counting via `onMiss`, a “miss then retry-success (yellow)” still counts as missed for accuracy (correctWords not incremented on retry).
3. Add logging (temporarily) for verification:
- When `allWordsRead` becomes true, log:
  - batchStartIndex, words.length, wordsRead, correctWords, computed accuracy
- When `triggerVictory/triggerDefeat` fires, log the reason and the same summary.

This gives concrete proof in the console that the condition fired.

</step 5>

<step 6 — Verification checklist (what I will test after implementing)>
1) All-words-read victory:
- Finish passage with >=80% accuracy while enemy still alive.
- Expected: immediately show VICTORY screen, no return to reading/combat.
2) All-words-read defeat:
- Finish passage with <80% accuracy.
- Expected: immediately show DEFEAT / Try Again screen.
3) Enemy death victory (normal attacks):
- Kill enemy by reading damage.
- Expected: VICTORY screen shows immediately.
4) Enemy death victory (mini-game damage):
- Reduce enemy to 0 HP inside a mini-game completion handler.
- Expected: VICTORY screen shows immediately, no reading reset.
5) Multi-enemy queue:
- Kill the first enemy in a guard/elite battle.
- Expected: enemy_transition, then next enemy, no victory.
- Kill dragon (final).
- Expected: VICTORY.

</step 6>
</implementation-plan>

<why-this-will-fix-your-screenshot>
Right now, your UI can reach:
- enemyHp = 0
- allWordsRead = true
but still not show victory because some other scheduled callback forces phase back to “reading”.

By making victory/defeat terminal + canceling pending timeouts + guarding every future phase change through `setPhaseSafe`, once victory happens it cannot be undone by any stray timeout. That’s the missing piece.
</why-this-will-fix-your-screenshot>

<files-to-change>
- `src/components/aura/game/rpg/RPGBattleArena.tsx` (primary; all fixes live here)
</files-to-change>
