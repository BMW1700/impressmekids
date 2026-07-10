## Draft-aware world numbering

Keep `world_number` in the database purely as a **sort key**. The `#N` label shown on both the admin list and the student-facing Pre-K screen becomes a **computed display index** over published worlds only.

### Behavior

- Sort order (both views): by `world_number` ascending — unchanged.
- Draft worlds:
  - Admin list: still visible in their sorted slot, still show the yellow **Draft** badge, but the `#` label is replaced with a muted `—` (no number consumed).
  - Student Pre-K screen: hidden entirely (already the case).
- Published worlds:
  - Numbered `#1, #2, #3, …` in sort order, skipping drafts.
  - Example from your screenshot: Yubi Village (Draft) → `—`, Colors → `#1`, Shapes → `#2`, Pronouns → `#3`, Family → `#4`, Animals → `#5`, Foods → `#6`, Body Parts → `#7`.
- Up/down arrows in the admin list still swap `world_number` between the two swapped rows (unchanged from the last fix). The displayed `#` recomputes automatically.

### Files to change

1. `src/pages/superadmin/PreKWorldsList.tsx` — compute a `publishedIndex` map after fetch; render `#{publishedIndex[w.id]}` for published worlds and `—` for drafts.
2. `src/components/aura/game/rpg/RPGWorldMap.tsx` — filter to published worlds (already done), then compute the same sequential `displayNumber` and pass it to the card instead of raw `world_number`.

No database migration and no changes to how the arrows work.