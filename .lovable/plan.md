
Summary:
I audited the RPG mode and it is not “perfect” yet. The bubble issue is real, there are still timer patterns that can fail or behave inconsistently, and there are layout/container choices that can cause visual clipping. The fixes need to be broader than one bubble tweak.

What is actually wrong:

1. Vocabulary bubbles still do not target the correct zone
- `RPGWordReader.tsx` currently computes bubble origin/target from `wordQueueRef`, which is the small queue row.
- Your screenshots show the correct visual path should rise much higher into the center/mid-screen action area before popping.
- The popup manager is mounted inside `RPGWordReader`, which itself lives in a center column with `overflow-hidden` in `RPGBattleArena.tsx`.
- Even though the popup wrapper uses `position: fixed`, the current anchor math is still based on the wrong element, so the bubbles pop too low and can appear missing depending on where they start.

2. The current “fixes” were too local
- Bubble motion was adjusted, but the system was not re-anchored to the actual intended destination region.
- There is no explicit target ref for the pop zone, so the code is guessing with viewport percentages instead of using the live battle layout.

3. Timer/reliability issues still exist across RPG minigames
I audited the major speech/timer minigames:
- `RPGWordShield.tsx` is closer, but still needs hardening and verification against re-init/restart edge cases.
- `RPGInkSplash.tsx`, `RPGWordCannon.tsx`, `RPGWordEcho.tsx`, `RPGQuickBlock.tsx`, `RPGSpellCombo.tsx`, `RPGRhymeChain.tsx`, `RPGSpeedTypist.tsx` still use mixed timer patterns with local intervals/timeouts and multiple completion paths.
- Several of them recreate intervals based on changing state or use direct `setTimeout(onComplete)` flows without a single guarded “complete once” function.
- That means some minigames can still double-complete, stall visually, or restart recognition at the wrong time.

4. Speech handling is inconsistent across minigames
- Some minigames use the shared `speechManager`.
- Others still use raw browser recognition instances (`RPGInkSplash`, `RPGGoblinHorde`, `RPGRollingBoulders`, `RPGWordCannon`, `RPGWordEcho`).
- That inconsistency is a major source of “timer didn’t start”, “mic stopped”, “minigame got stuck”, and transition conflicts when entering/exiting phases.

5. Background/clipping risk is real
- `RPGBattleArena.tsx` and several child containers use `overflow-hidden`.
- `RPGBattleBackground.tsx` itself is also `absolute inset-0 overflow-hidden`.
- Some of that is intentional, but for certain animated overlays and moving elements it increases the chance of visible clipping, especially during transitions or on unusual aspect ratios.

What I will implement:

1. Fix the bubble trajectory correctly
- Add a dedicated target anchor for the vocabulary bubble pop zone in the battle reading area.
- Stop using only the queue row as the destination reference.
- Compute:
  - start position from the lower word/reader area
  - end position from a higher center-screen anchor that matches your screenshot
- Keep the path visibly rising higher before the pop.

2. Make the bubble system deterministic
- Ensure every bubble:
  - spawns visibly
  - travels to the target zone
  - pops there
  - removes itself exactly once
- Keep a small concurrency cap, but do not silently drop bubbles before they render.
- If needed, switch from “drop oldest immediately” to a tiny queue/stagger model.

3. Harden Word Shield completely
- Re-audit `RPGWordShield.tsx` and convert it to one strict completion path:
  - initialize
  - building/listening
  - impact
  - done
- Use refs as source of truth for timer active/completed state.
- Guarantee:
  - countdown starts immediately
  - countdown visibly decrements every second
  - speaking all words completes instantly
  - hitting zero completes instantly
  - `onComplete` fires once only
  - no restart after completion

4. Audit and normalize all timed speech minigames
I will review and harden at least these:
- `RPGWordShield.tsx`
- `RPGInkSplash.tsx`
- `RPGGoblinHorde.tsx`
- `RPGRollingBoulders.tsx`
- `RPGWordCannon.tsx`
- `RPGWordEcho.tsx`
- `RPGQuickBlock.tsx`
- `RPGSpellCombo.tsx`
- `RPGRhymeChain.tsx`
- `RPGSpeedTypist.tsx`

For each one I will:
- add a single guarded completion function
- prevent duplicate timers
- prevent duplicate `onComplete`
- prevent recognition restarts after finish
- ensure timers do not depend on fragile stale closures

5. Unify speech recognition behavior where needed
- Move the riskiest raw-recognition minigames toward the same stability model used by the shared speech manager, or at minimum mirror its guarded lifecycle.
- Ensure phase transitions stop the previous listener before the next one can start.

6. Fix clipping/background safety
- Audit animated RPG overlays against parent `overflow-hidden` containers.
- Loosen clipping only where needed so effects are visible without exposing layout overflow bugs.
- Verify the battle background always fills the viewport cleanly and does not reveal seams or clipped edges during transitions.

7. QA pass for “perfect product” standard
After implementation I will verify:
- vocabulary bubbles rise to the higher center zone and pop there
- shield countdown always starts and ends correctly
- Ink Splash timer visibly counts down from start
- Horde words remove goblins immediately
- boulders/echo/quick block/spell combo/speed typist do not stall
- no minigame gets stuck on entry or exit
- no obvious background clipping on the current viewport

Technical details:
Primary files likely to change:
- `src/components/aura/game/rpg/RPGWordReader.tsx`
- `src/components/aura/game/rpg/RPGEmojiPop.tsx`
- `src/components/aura/game/rpg/RPGWordShield.tsx`
- `src/components/aura/game/rpg/RPGInkSplash.tsx`
- `src/components/aura/game/rpg/RPGGoblinHorde.tsx`
- `src/components/aura/game/rpg/RPGRollingBoulders.tsx`
- `src/components/aura/game/rpg/RPGWordCannon.tsx`
- `src/components/aura/game/rpg/RPGWordEcho.tsx`
- `src/components/aura/game/rpg/RPGQuickBlock.tsx`
- `src/components/aura/game/rpg/RPGSpellCombo.tsx`
- `src/components/aura/game/rpg/RPGRhymeChain.tsx`
- `src/components/aura/game/rpg/RPGSpeedTypist.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- possibly `src/components/aura/game/rpg/RPGBattleBackground.tsx`

Why this plan is different:
- It does not assume the problem is only the popup animation.
- It treats the RPG mode as a system: anchors, clipping, timers, recognition lifecycle, and completion guards all need to be corrected together.
- That is the only honest way to get this stable enough for a polished product.
