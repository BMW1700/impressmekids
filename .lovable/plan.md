# Plan: Make Castle Swarm Discoverable + Finish to 100%

## Why you can't see Castle mode

It IS built and wired — but only on the **Game Dashboard** (`/game`), as a "Castle Swarm Defense" card. The screenshot you sent is the **AURA Reading** screen (`/student/aura` via the Stories/Bookshelf/Present/Challenges/Progress tabs). There is zero link to Castle from AURA Reading, so from where you are it's invisible.

Two fixes: (1) surface it where you're looking, (2) close the last polish items.

---

## Part A — Discoverability (so you actually see it)

1. **Add a "Castle Swarm Defense" hero card to AURA Reading** (`AuraReadingSection.tsx`), placed right under the Story Campaign / RPG Mode cards. Same visual weight as RPG Mode card — amber/rose gradient, Castle icon, "NEW" badge, "Enter Castle" button → `navigate('/game/castle-swarm')`. This is the one the user is staring at.
2. **Bump the Game Dashboard card** to position #2 (it already is) and add a "NEW" pill so it's unmissable on `/game`.

No other navigation surfaces touched.

---

## Part B — Phase 2 → 100% (the 3 polish items deferred earlier)

3. **Mount `WaveInterstitial`** between waves in `CastleSwarmArena`. Currently the file exists but isn't rendered. Show it for 1.8s on wave clear with the wave number + brief tip; auto-dismisses into next wave.
4. **Pause button + settings sheet** in `CastleSwarmArena` top-right. Tapping pauses the game loop (sets a `pausedRef`), opens a sheet with: Resume, Quit to menu, Mic sensitivity slider (passes through to `speechRecognitionManager`), SFX volume toggle. Pause also halts speech recognition; Resume restarts it for the same word.
5. **Boss waves every 5th wave** — in `startWave`, if `n % 5 === 0`, multiply enemy HP ×3, drop count to 1, mark as boss in the banner ("⚔️ Boss Wave!"), and play the existing victory stinger only on boss clears (not every wave).

---

## Part C — Verification (what I'll check before saying done)

- Open `/student/aura` → see Castle card → click → lands on Castle campaign select.
- Run a campaign level → win → row appears in `castle_swarm_campaign_progress` with correct stars → next level unlocks.
- Buy an upgrade → coins debit via RPC → knight stats reflect new level on next run.
- Wave 5 in endless renders as boss with 3× HP and the stinger plays once.
- Pause sheet halts the loop and resumes cleanly.
- Other modes (LexiQuest, AURA reader, Phonics) untouched — verified by file diff scope.

---

## Files

**Edit:**
- `src/components/student/sections/AuraReadingSection.tsx` — add Castle card
- `src/pages/game/GameDashboard.tsx` — NEW pill on Castle card
- `src/components/aura/game/castle/CastleSwarmArena.tsx` — mount interstitial, pause button, boss-wave logic, stinger gating
- `src/components/aura/game/castle/WaveInterstitial.tsx` — minor prop tweaks if needed

**Create:**
- `src/components/aura/game/castle/PauseSettingsSheet.tsx` — pause/resume/quit + sliders

**Untouched:** all other modes, all hooks, no DB migration needed (Phase 2 already wrote the RPC + tables).

---

## Out of scope (deferred to next turn if you want it)

- Parent-as-Enemy Co-op ("Castle Siege 2P") — separate 6-file realtime build. Say "ship co-op" after this lands and I'll do it cleanly.
