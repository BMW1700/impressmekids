## Brutally honest audit

The unwanted screen is not a loading screen. It is a fallback that was added in `RPGLevelSelect` when `levels.length === 0`.

The deeper problem is that the Pre-K RPG flow currently has two separate sources of truth:

1. `RPGWorldMap` fetches published Pre-K worlds/levels directly from the backend and builds clickable world cards.
2. `AuraPractice` separately calls `usePublishedPrekLevels` after a world is selected, starts with an empty `Set`, and then filters the selected world's levels through that empty set on first render.

That creates the glitch: when you click a world, the normal level-select screen can briefly receive `[]` before the published levels hook finishes. The fallback then shows “This adventure isn’t ready yet,” even when the world actually has levels.

There is also a real data-flow bug for database-only Pre-K worlds: `isPreKWorldId()` only recognizes hardcoded worlds `101/102/103`, so DB worlds like “Learn About Different Foods” depend on `world.mode === 'prek'` being carried correctly from `RPGWorldMap`. The flow mostly does that, but the level-loading path is still fragile because it re-fetches and re-filters levels after selection.

## Fix plan

1. **Remove the unwanted empty-state card**
   - Delete the “This adventure isn’t ready yet” block from `RPGLevelSelect`.
   - If a world has no levels, the normal world header and normal level grid area will render with no cards, exactly as requested.

2. **Stop showing false empty levels while Pre-K data is still loading**
   - Use the `loading` value from `usePublishedPrekLevels` in `AuraPractice`.
   - For selected Pre-K worlds, do not filter levels down to an empty set while the hook is still loading.
   - This prevents the fake “empty world” moment caused by async timing.

3. **Make Pre-K world detection reliable for database-only worlds**
   - Treat any `selectedWorld.mode === 'prek'` as Pre-K, not just the hardcoded `101/102/103` IDs.
   - Keep the existing hardcoded ID support as a fallback.

4. **Keep clickable worlds stable**
   - In `RPGWorldMap`, stop removing published worlds just because zero published levels were returned during a fetch timing edge.
   - Render the world card normally; if it truly has no levels, clicking it simply shows the normal empty level-select screen with the Back button/header, not a scary fallback screen.

5. **Verify the RPG route behavior**
   - Check that the unwanted text is gone from source.
   - Verify that the normal level-select screen renders after selecting a world, and that empty worlds do not show the fallback card.
   - Check for leftover temporary RPG smoke routes/files; remove them only if they exist.

## Files to change

- `src/components/aura/game/rpg/RPGLevelSelect.tsx`
- `src/pages/student/AuraPractice.tsx`
- `src/components/aura/game/rpg/RPGWorldMap.tsx`
- Possibly `src/App.tsx` only if a temporary diagnostic route is still present, but the current read did not show one.

## Expected result

Clicking RPG/Pre-K worlds will show the normal level-select screen. No “Adventure isn’t ready yet” card. No fake blank/empty state caused by async level-loading. If a world truly has no levels, it will just show the normal world screen with no level cards yet.