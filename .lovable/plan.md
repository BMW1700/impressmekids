## Brutally honest audit summary

No, RPG mode is not perfect right now.

The biggest confirmed issue is Lightning Storm: it has its own separate speech-recognition loop instead of using the safer shared `RPGWordReader`, and its cleanup/restart logic can leave old recognition instances trying to restart while new ones are created. That matches your “breaks the entire computer” report closely enough that it should be removed immediately, not patched.

The second issue is the fast-reader stiffness: the current fast-mode fix still relies on chained `setTimeout` callbacks spaced around the feedback lock. That is safer than before, but it still creates an artificial 150–170ms step between each word. For Elara/Cypher, that means a 5-word breath can still feel like five separate slow confirmations instead of one fluid burst.

Castle Swarm is promising, but not perfect: it uses the same `RPGWordReader` in fast mode, has a solid requestAnimationFrame loop, and avoids the dangerous Lightning Storm component. The main risk I found is the boss Spell-Break overlay: it runs fast-mode reading while the main Castle reader remains mounted underneath. Disabled/frozen game logic helps, but I would harden it so only one reader is actively listening during boss chants.

## Plan

### 1. Scrap Lightning Storm completely

- Remove `lightning_storm` from the RPG minigame type list.
- Remove the `RPGLightningStorm` import and render branch from `RPGBattleArena`.
- Remove the `lightning_storm` battle phase, announcement, and phase mapping.
- Delete or fully orphan the `RPGLightningStorm.tsx` component so it cannot launch anywhere.
- Replace every enemy assignment that currently includes Lightning Storm with safer existing minigames:
  - World 6 Storm Harpy: replace with `wind_chase` / `word_shield` style rotation.
  - World 6 Cloud Giant signature: change from `lightning_storm` to `word_shield` or `rolling_boulders`.
  - World 6 Zephyr: keep `wind_chase` signature and remove Lightning Storm from random pool.
  - Later-world enemies: replace Lightning Storm with safer already-used minigames like `speed_typist`, `word_shield`, `wind_chase`, `asteroid_barrage`, or `spell_combo` depending on theme.

### 2. Add a safety fallback so it can never launch

Even after data cleanup, I will add a defensive guard in the minigame trigger path:

```text
if a retired/unsafe minigame is requested -> substitute a safe minigame before setting phase
```

This prevents old saved data, stale constants, or future accidental references from launching a retired minigame.

### 3. Make Elara/Cypher fast reading actually feel fast

Replace the current queued 170ms-per-word chaining with a dedicated fast-burst path:

- Keep normal characters unchanged.
- For `mode="fast"`, when one speech result contains multiple correct words in order, collect the whole in-order run first.
- Apply those matches as a burst instead of waiting through the normal feedback lock for every word.
- Reduce the fast-mode target arming delay so the next target is ready almost immediately.
- Clear/abort queued fast callbacks cleanly on batch change, pause, disabled state, and unmount.
- Preserve safety checks: wrong word 3 still stops the chain; retries still remain single-word practice; normal mode remains strict.

Expected behavior: Elara/Cypher reading 5 words in one breath should feel like one smooth 5-word burst, not five slow mini-pauses.

### 4. Fix a likely batch-complete timing issue

The reader currently reports batch results from React state that may lag behind rapid chained/burst matches. I will make batch completion use a ref-backed latest results map so fast bursts do not lose the last word’s result or trigger stale batch behavior.

### 5. Harden Castle Swarm Defense

- Disable the main Castle `RPGWordReader` while Boss Spell-Break is active so there is only one active mic reader at a time.
- Add cleanup for delayed boss-spell launch timers so leaving the game or ending a run cannot fire a late overlay.
- Keep Castle’s main loop and gameplay intact; this is a stability hardening pass, not a redesign.

### 6. Verification

After implementation I will verify:

- No `lightning_storm` launch path remains.
- World 6 no longer has Lightning Storm in random or signature minigames.
- Later worlds no longer reference Lightning Storm.
- Elara/Cypher fast mode supports a 5-word spoken burst without artificial slow stepping.
- Normal characters, retry behavior, and misses remain unchanged.
- Castle Swarm still launches, reads, pauses, and resolves boss Spell-Break without dual active readers.