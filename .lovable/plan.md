
Summary:
Audit confirms there are two separate regressions:
1. The shield minigame logic was “fixed” in a way that now exits too aggressively in one path and never really enters live countdown/listening in another path.
2. The vocabulary meaning bubbles are no longer being managed as anchored moving objects; they’re now rendered as generic centered popups, so they can stack visually and never behave like the old “flow in and pop” effect.

What I found:
- `src/components/aura/game/rpg/RPGWordShield.tsx`
  - The component now sets `phase` straight to `'done'` inside `completeShield(...)`.
  - The only animated result UI still checks for `phase === 'impact'`, so the state machine is internally inconsistent.
  - The countdown effect only runs while `phase === 'building'`, but current startup/listening is fragile and likely getting interrupted by the speech manager lifecycle before the timer loop really becomes active.
  - There is no proper “single completion path + short impact animation + return” flow anymore.
- `src/components/aura/game/rpg/RPGWordReader.tsx`
  - Emoji/meaning popups are being pushed into `emojiPopups`, but each popup is rendered with `RPGEmojiPop` directly.
- `src/components/aura/game/rpg/RPGEmojiPop.tsx`
  - `RPGEmojiPop` ignores positional data and always renders at fixed screen center (`left: 50%`, `top: 40%`).
  - There is a manager component that supports positions, but it is not being used by `RPGWordReader`.
  - Result: each new bubble appears in the same place and the old “travel then pop then clear” behavior is effectively broken.

Implementation plan:

1. Repair the shield minigame state machine
- Rework `RPGWordShield.tsx` so it has one clear lifecycle:
  - initialize
  - building/countdown/listening
  - impact
  - done
- `completeShield(...)` should:
  - guard against duplicate completion
  - stop recognition
  - compute final shield power
  - transition to `impact`, not directly to `done`
- After a short controlled impact timeout, call `onComplete(...)` once and then mark `done`.
- Make the countdown source-of-truth ref-based so timer ticks cannot freeze from stale closures.
- Add a startup guard so listening starts once per mount and cannot get silently skipped.

2. Make shield timer and recognition robust
- Keep refs for:
  - current word index
  - current phase
  - timer active/completed status
- Ensure timer always decrements from 12 to 0 while in building phase.
- Ensure speaking all words instantly resolves the minigame.
- Ensure reaching zero also resolves the minigame immediately.
- Ensure cleanup always stops the shield speech session on unmount/phase exit.

3. Restore the old bubble behavior properly
- Update `RPGWordReader.tsx` to use positioned popup objects instead of generic centered ones.
- Either:
  - switch to `RPGEmojiManager`, or
  - enhance `RPGEmojiPop` to accept `x/y` directly and render at those coordinates.
- Spawn each new meaning bubble from a meaningful origin area near the reading panel/word area instead of dead center.
- Animate each bubble toward the target area and then pop/remove it on completion.

4. Prevent bubble pile-up
- Limit concurrent active bubbles or queue them briefly so rapid correct words don’t overlap forever.
- Guarantee `onComplete` removes the bubble from state every time.
- If multiple power words occur fast, stagger them slightly so they still pop instead of visually stacking.

5. Audit related RPG speech-driven minigames for the same regression pattern
- Check recent minigame fixes for the same anti-patterns:
  - direct state updates inside long-lived callbacks
  - missing refs for timer/index state
  - mismatched phases (`impact` UI but `done` state)
  - centered overlays replacing anchored animated entities
- Specifically re-verify:
  - `RPGWordShield.tsx`
  - `RPGGoblinHorde.tsx`
  - `RPGRollingBoulders.tsx`
  - `RPGWordReader.tsx`
  - `RPGEmojiPop.tsx`

6. QA after implementation
- Verify shield minigame:
  - timer starts immediately
  - counts down visibly every second
  - finishes when all words are spoken
  - finishes when timer hits zero
  - returns control to battle every time
- Verify meaning bubbles:
  - spawn in the right place
  - travel/pop visually
  - disappear after pop
  - do not stack forever during rapid reading
- Run through at least one full boss encounter and one normal battle to confirm no RPG phase gets stuck.

Technical details:
- Primary files to modify:
  - `src/components/aura/game/rpg/RPGWordShield.tsx`
  - `src/components/aura/game/rpg/RPGWordReader.tsx`
  - `src/components/aura/game/rpg/RPGEmojiPop.tsx`
- Likely root causes:
  - broken shield phase transition (`done` used where `impact` is expected)
  - popup rendering regression from anchored/managed visuals to fixed centered overlay
  - recent “quick fixes” solved one bug but broke the original minigame interaction model
