

## The Word Shield doesn't register speech for the word "a"

**Root cause**: The word "a" is a single character. After cleaning (`replace(/[^a-z]/g, '')`), every spoken candidate and every target word filter requires `length >= 2`. The word "a" has length 1, so it is discarded before it ever reaches the matching logic. Speech recognition IS working (the green "Listening..." indicator confirms this) — the match just silently fails.

**Scope**: This `length >= 2` filter exists in **11 RPG minigame files**, meaning any single-character word ("a", "I") will fail to register in any minigame.

---

### Fix

Change the minimum length filter from `>= 2` to `>= 1` across all affected files. The filter was originally there to discard noise/artifacts from speech recognition splitting, but single-letter English words ("a", "I") are legitimate and must be matchable.

**Files to update** (all in `src/components/aura/game/rpg/`):

1. **RPGWordShield.tsx** — line 156: `.filter((value) => value.length >= 1)`
2. **RPGWordCannon.tsx** — line 150: `cleanSpoken.length >= 1`
3. **RPGRollingBoulders.tsx** — line 150: `cleanSpoken.length >= 1`
4. **RPGGoblinHorde.tsx** — lines 114, 257: both `>= 1`
5. **RPGFireballBarrage.tsx** — line 160: `>= 1`
6. **RPGVoidPull.tsx** — line 166: `>= 1`
7. **RPGGhostlyWhispers.tsx** — line 129: `>= 1`
8. **RPGGroundRipple.tsx** — lines 46, 181: both `>= 1`
9. **RPGWebTrap.tsx** — lines 123, 126: `>= 1`
10. **RPGSpeedTypist.tsx** — lines 129, 131: `>= 1`
11. **RPGQuickBlock.tsx** — check and fix if same pattern exists

Each change is a single-character edit (`2` → `1`). No logic changes needed.

