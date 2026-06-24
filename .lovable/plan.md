## Goal

On `/super-admin/prek` (Pre-K Worlds list), show worlds in their saved sort order and let the admin reorder them with up/down arrows that swap a world with its neighbor.

## Why the current screenshot looks "out of order"

The list already queries `prek_worlds` ordered by `sort_order` ASC. The reason you see `#1, #4, #5, #2` is that the badge `#N` shows `world_number` (an identifier), not the position. The actual row position IS the sort order. So "show in order" = keep ordering by `sort_order` (already correct), and the new arrows mutate `sort_order` so the visible row order matches what you want.

## Changes — single file: `src/pages/superadmin/PreKWorldsList.tsx`

1. **Normalize sort_order on load.** After fetching, reassign `sort_order` to `0..n-1` in memory based on the returned order so swaps are always well-defined even if values are duplicated or sparse.
2. **Add `moveWorld(index, direction)`** — swaps the world at `index` with the one at `index ± 1`:
   - Optimistically reorder the local `worlds` array (snappy UI).
   - Persist both rows' new `sort_order` with two `update`s against `prek_worlds` (by `id`). On error, revert + toast.
3. **UI: add a small vertical arrow stack on the left of each card** (next to the `#N` badge):
   - `ChevronUp` button — disabled on the first row.
   - `ChevronDown` button — disabled on the last row.
   - `variant="ghost"`, `size="icon"`, `h-6 w-6`, tight stack so it doesn't crowd the title row.
4. **New-world default sort_order** stays `worlds.length` (appends to end) — already correct.

## Not changing

- DB schema (the `sort_order` column already exists on `prek_worlds`).
- Student-facing ordering — `usePublishedPrekLevels` already orders by `sort_order`, so admin reorders flow through automatically.
- The `#world_number` badge stays as the stable world identifier; only row position changes.

## Files touched

- `src/pages/superadmin/PreKWorldsList.tsx` — add `moveWorld`, two chevron buttons per row, normalize sort_order on load.
