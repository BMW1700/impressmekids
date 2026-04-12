

## Fix Stale Closure in Fireball Defense Destroy Flow

### The Problem

In `RPGFireballDefense.tsx`, `handleSelectFireball` sets `selectedFireball` state then immediately calls `startListening`. Inside `startListening`, the `onresult` handler calls `destroyFireball`. But `destroyFireball` is a `useCallback` that depends on `selectedFireball` — which may still be `null` at the time `startListening` captures its reference, because React state updates are async.

This means: player taps a fireball, speaks the word correctly, matching succeeds, but `destroyFireball()` exits early because `selectedFireball` is null in its closure.

### The Fix

Use a ref (`selectedFireballRef`) to track the current selection, and have `destroyFireball` read from the ref instead of state. This eliminates the stale closure issue entirely.

**File**: `src/components/aura/game/rpg/RPGFireballDefense.tsx`

1. Add `const selectedFireballRef = useRef<Fireball | null>(null);`
2. In `handleSelectFireball`, set `selectedFireballRef.current = fireball` before calling `startListening`
3. In `destroyFireball`, read from `selectedFireballRef.current` instead of `selectedFireball` state
4. Remove `selectedFireball` from `destroyFireball`'s dependency array

This is a small, surgical fix — ~5 lines changed.

