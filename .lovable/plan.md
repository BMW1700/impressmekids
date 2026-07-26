## RPG Pre-Launch Fix Pass

Two confirmed defects shipped in the last change, plus three retention gaps. Fix the defects first — they are the only true blockers to App Store submission.

---

### Tier 1 — Blockers (must fix before submission)

**1. Wire up the 4 dead quest types**

Four of the seven quest types in the server pool have no client call sites, so they can never complete:

| Quest type | Where to award it |
|---|---|
| `perfect_battles` | Battle victory when the run took zero player damage / zero misreads |
| `words_read` | The reading/word-check success path, one per correctly read word |
| `play_streak` | Once per day on entering the Adventure |
| `minigame_wins` | Each mini-game success resolution |

**2. Remove boss quest double-counting**

`RPGVictoryArena` awards `defeat_bosses` unconditionally while `RPGCombatPhase` also awards it, inflating quest progress and Season XP. Make arena victory award boss credit only when the arena opponent is genuinely a boss, and ensure the two paths cannot both fire for one defeat.

---

### Tier 2 — Retention (recommended before, safe after)

**3. Weekly parent digest**

A scheduled backend job that emails each linked parent a short weekly recap: bosses defeated, words read, current rank and season tier, plus the child's best highlight card link. This is the purchase trigger for parents and the piece most missing today.

**4. Boss Spectacle audio**

Add an entrance stinger and a phase-transition cue, respecting the existing game mute/settings toggle. Currently the spectacle is silent, which mutes the "wow" moment on a classroom iPad.

**5. Surface rank and quests in-play**

Show a compact rank badge and an "N quests ready to claim" indicator in the game header, so the Daily Hub and Leaderboard are discoverable without going back to character select.

---

### Explicitly out of scope

More bosses, more loot rarities, extra worlds, additional cosmetics. Those are post-launch content, not launch blockers.

---

### Technical notes

- Quest awards go through the existing `awardQuestProgress(questType, delta)` helper in `src/hooks/useDailyQuests.ts`; no schema change is required for Tier 1.
- The `words_read` quest will fire frequently, so batch increments rather than one network call per word.
- The parent digest needs a scheduled edge function plus a send trigger; it will reuse the existing app email infrastructure and must respect each parent's notification preferences and consent flags.
- Audio assets must be small and preloaded so they do not delay the spectacle animation.
