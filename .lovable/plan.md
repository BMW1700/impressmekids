

# Gap 1: Add Phoneme Tracking to RPG Battles

## What Changes
One file modified: `src/components/aura/game/rpg/RPGBattleArena.tsx`

## How It Works

1. **Add import** for `getIPAPronunciation` from `@/lib/cmuDictWrapper`

2. **Add a ref** to accumulate phoneme data throughout the battle:
   ```ts
   const phonemeAccumulatorRef = useRef<Record<string, { correct: number; total: number }>>({});
   ```

3. **Inside `handleWordResult`** (line ~1325, after `const word = words[globalIndex] || ""`), add ~10 lines:
   - Call `getIPAPronunciation(word)` to get the phoneme array
   - For each phoneme, increment `total` by 1
   - If `correct`, also increment `correct` by 1
   - Wrapped in try/catch so any failure is silently logged (zero risk to game flow)

4. **At battle end** (line ~1690), replace `phonemeScores: {}` with:
   - Convert the accumulator to `{ phoneme: score_0_to_100 }` format
   - `score = Math.round((correct / total) * 100)` per phoneme

## What This Achieves
- Every RPG battle now feeds real phoneme-level accuracy data into the ML pipeline
- The Q-Learning agent gets actual training signal from combat sessions
- Zero changes to damage formulas, HP, streaks, or any game mechanics

