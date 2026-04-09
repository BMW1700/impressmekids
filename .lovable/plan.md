

## Why RPG mode freezes on the "PERFECT BLOCK" screen with repeating sounds

**Root cause**: `RPGQuickBlock.tsx` was missed during the minigame hardening pass. Its result-phase `useEffect` (line 94) includes `onComplete` in its dependency array. The parent's `handleQuickBlockComplete` callback gets recreated on re-renders (because its dependency `returnToReading` changes). Each time `onComplete` gets a new reference, the effect re-fires — replaying the shield/combo sounds and scheduling another `onComplete` timeout. This creates:

1. The "constant annoying noise" — sounds replaying on every re-fire
2. The freeze — multiple `onComplete` calls fight with each other, potentially causing the phase to bounce or get stuck

**The fix**: Apply the same `completionTriggeredRef` + `onCompleteRef` guard pattern already used in `RPGWordShield`, `RPGInkSplash`, and the other hardened minigames.

---

### Changes to `src/components/aura/game/rpg/RPGQuickBlock.tsx`

1. Add `completionTriggeredRef` and `onCompleteRef` refs
2. Keep `onCompleteRef` synced with the latest `onComplete` prop
3. Remove `onComplete` from the result `useEffect` dependency array — use the ref instead
4. Guard the result effect and the timeout callback with `completionTriggeredRef` so sounds play exactly once and `onComplete` fires exactly once
5. Set `completionTriggeredRef = true` before scheduling the completion timeout
6. Reset `completionTriggeredRef` on unmount cleanup

This is a targeted fix to one file, applying the exact same pattern that already works in the other minigames.

