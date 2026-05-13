## Code Red Fix: Reading stops after 2 words

### Root cause
`src/components/aura/game/effects/MilestoneCelebration.tsx` line 129–138 uses a 3-keyframe `scale: [0, 1.2, 1]` array combined with `type: "spring"`. Framer-motion only supports 2 keyframes with spring — it throws an uncaught error. The error fires when the streak milestone celebration mounts (x2/x3 streak), which:

1. Crashes the React subtree mid-render
2. Tears down the speech-recognition listener
3. Leaves the mic state stuck — the next word never registers

This is **pre-existing** code, not caused by the verb-animation work, but it surfaces on every RPG battle because streak milestones now hit fast.

### Fix (one file, ~5 lines)

In `MilestoneCelebration.tsx`:

1. Remove `type: "spring"` from the main card transition (line 134–138). Keep `duration: 0.5` with `ease: "easeOut"` so the 3-keyframe `[0, 1.2, 1]` pop still works.

That's it. No other behavior changes, no verb-animation rollback needed.

### Verification
- TypeScript build clean
- Open battle, read 5 words, hit x2 and x3 streak — confirm no console error and mic stays live across all 5 words
- Confirm the milestone card still pops in correctly (just tweened instead of spring-bounced)

### Why nothing else needs to change
- Verb animations: not in the stack trace, descriptors all use 2-keyframe or non-spring transitions
- Speech recognition: not buggy in itself; it's being killed by an unrelated render-time exception
- `XPPopup` and `WordFeedbackOverlay` also use `[0, 1.2, 1]` but with explicit `duration` (no spring) — they're safe