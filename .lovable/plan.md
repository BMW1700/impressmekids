## Goal

Extend the existing **Clean Slate** button so it does exactly what you want:

- Keep every world, every level, every word, every ask line / success line / title / goal — **all text stays in the DB, untouched**.
- Unpublish everything except the 2 canon levels (Benny Picks a Drink, Help Benny Visit Grandma) and their parent worlds.
- **Also blank out the video slots** on every non-canon level + word so the Build page shows empty "Upload video" dropzones, ready to receive new footage.

Net effect: you open any non-canon level, all the text and word rows are still there, but every video slot is empty. Upload the two clips, hit Redub + Music, done.

## What changes

**File:** `src/pages/superadmin/PreKWorldsList.tsx` — expand `cleanSlatePurge()`.

Current behavior: only flips `is_published` to false.

New behavior (single transaction-ish sequence, canon IDs excluded throughout):

1. `UPDATE prek_levels SET is_published = false, opening_video_url = NULL, closing_video_url = NULL, opening_video_duration_seconds = NULL, closing_video_duration_seconds = NULL WHERE id NOT IN (canon)`
2. `UPDATE prek_level_words SET first_video_url = NULL, second_video_url = NULL, first_video_duration_seconds = NULL, second_video_duration_seconds = NULL WHERE level_id NOT IN (canon)`
3. `UPDATE prek_worlds SET is_published = false WHERE id NOT IN (canon)`
4. (Optional, off by default) Delete the orphaned storage objects from the `prek-video` bucket. **Skipping this** for safety — cheap to leave, and no risk of nuking a file that's still referenced somewhere. You can re-upload freely; new uploads overwrite the slot.

Untouched columns (text preserved):
- `prek_worlds`: title, description, world_number, difficulty
- `prek_levels`: title, goal, level_number, audio settings
- `prek_level_words`: spoken word, ask_line, success_line, sort_order, everything else

## Confirmation copy

Update the modal text to:

> CLEAN SLATE — unpublish + clear videos
>
> This will, for every Pre-K world/level EXCEPT "Benny Picks a Drink" and "Help Benny Visit Grandma":
> • unpublish the world + level (hidden from players)
> • clear every video slot (opening, closing, and every word's before/after video)
>
> All text is preserved — titles, words, ask lines, success lines, goals. Re-uploading a video is the only step needed to re-publish.

## Verification

After running:
- World Map for players still shows only the 2 canon levels.
- Super Admin → Pre-K Worlds still lists every world/level with all text intact, marked Draft.
- Opening a non-canon Build page shows empty upload dropzones for opening/closing + every word slot.

## Non-goals

- No schema change.
- No storage deletion (files stay in the bucket, unreferenced — safe to leave; can add a follow-up "hard purge" later if you want).
- No changes to the two canon levels.
