# Show "Pre-K" on the first 3 worlds + add Pre-K grade level

The first 3 RPG worlds (101 First Words, 102 Action Time, 103 Word + Picture) are already Pre-K content (`mode: 'prek'`) in `src/lib/campaignData.ts`, but their badge currently shows **"Kindergarten"** because `requiredGradeLevel` is `0` and `getGradeTitle(0)` returns "Kindergarten".

## Changes

**1. `src/components/aura/game/rpg/RPGWorldMap.tsx` (line ~545)**
Replace the grade badge with a Pre-K-aware version:
```tsx
{world.mode === 'prek' ? 'Pre-K' : getGradeTitle(world.requiredGradeLevel)}
```

**2. `src/components/aura/game/rpg/RPGLevelSelect.tsx` (line ~181)**
Same swap in the world header line:
```tsx
World {world.id} — {world.mode === 'prek' ? 'Pre-K' : getGradeTitle(world.requiredGradeLevel)}
```

**3. `src/lib/gradeUtils.ts` — add Pre-K as a real grade option**
- Add `{ value: -1, label: 'Pre-K', short: 'Pre-K' }` at the top of `GRADES_K12`.
- Update `getGradeDisplay(-1)` → `'Pre-K'` and `getGradeTitle(-1)` → `'Pre-K'`.
- Leave `requiredGradeLevel: 0` on the Pre-K worlds untouched (mode-based check above handles the badge); changing it to -1 would risk breaking unlock/sort logic elsewhere.

## Out of scope
- No changes to world content, unlock logic, or grade_mode routing.
- No DB/schema changes.

Confirm and I'll implement.
