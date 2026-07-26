## Brutally honest verdict

RPG mode is genuinely strong — loot, boss spectacle, seasons, ranks, highlights, quests, coach marks, teacher reporting. It is *shippable*. It is not *perfect*, and one thing I just verified is actually broken.

### Confirmed broken (verified by reading the code, not guessing)

**1. `RPGCombatPhase.tsx` is dead code — nothing imports it.**
It is the only place in the app that awards `defeat_bosses`, and one of only two places awarding `defeat_enemies` / `battle_wins`. Because it never renders:
- `defeat_bosses` is awarded **nowhere** — that quest can never complete.
- `defeat_enemies` and `battle_wins` are awarded **only** in `RPGVictoryArena`, which `RPGBattleArena` renders only on `boss` / `final_boss` victories. Every ordinary battle win credits nothing.

The previous fix removed the double-count from the wrong side: the survivor was the file nobody uses.

**2. `minigame_wins` over-credits.**
It fires on any transition out of a mini-game phase while alive. Mini-games that are *failed* also transition back to `reading`/`combat` alive, so losses count as wins.

### Real but not blocking
- No weekly parent digest (blocked by bulk-email policy — needs the in-app or on-demand variant instead).
- No dynamic season content beyond what an admin types; cosmetics are titles/badges, not visual character changes.
- No mid-play social proof (classmate activity ticker).

---

## Proposed fix pass

**A. Move battle/boss quest credit into the live battle component**
In `RPGBattleArena`, at the single terminal-victory point that already flushes `words_read`:
- award `defeat_enemies` and `battle_wins` on every victory;
- award `defeat_bosses` when `isBossType(enemy.type)`.
Remove the awards from `RPGVictoryArena` entirely so the bonus brawl never adds a second credit.

**B. Delete `RPGCombatPhase.tsx`**
Unreferenced dead code that misleads future audits. (Confirmed: zero imports outside itself.)

**C. Make `minigame_wins` accurate**
Only credit when the mini-game resolved successfully — gate the transition-watcher on the existing success signal rather than "still alive", so failures don't award progress.

**D. Verify, don't assume**
After the change, run a scripted battle in the preview and read back the quest rows to confirm exactly one increment per event.

### Out of scope here
Parent digest, new cosmetics, new bosses, social ticker. Those are post-launch.

### Then: App Store
Once A–D are verified, RPG is done for v1 and the remaining work is Capacitor porting, iOS speech adapter validation on device, and submission assets.

### Technical notes
- All awards route through `awardQuestProgress(questType, delta)` in `src/hooks/useDailyQuests.ts`; no schema change.
- The terminal-phase effect in `RPGBattleArena` (around line 404) already guards with `questsSettledRef`, so adding awards there is idempotent per battle.
