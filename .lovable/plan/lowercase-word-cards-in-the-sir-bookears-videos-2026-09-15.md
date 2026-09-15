# Lowercase word cards in the Sir Bookears videos

Right now the word gate that pops up mid-video shows the word in all capitals ("JUMP"). Every word shown on screen during a video should display in lowercase ("jump"), no matter how it was typed in the backend.

## What changes

- The word card in the video adventure shows the word in lowercase.
- The same card in the non-video (animated) adventure shows lowercase too, so both paths match.
- The backend preview player used when building levels shows the word lowercase, so what an editor sees matches what a child sees.
- Words typed into the level builder in any capitalization are stored and displayed lowercase — typing "JUMP" or "Jump" still shows "jump" in the video.
- Spoken-answer matching, scene artwork selection, and progress tracking are unaffected: those keep using their existing internal comparison, which ignores capitalization.

## Technical notes

- `src/components/aura/game/rpg/YubiVideoAdventure.tsx` and `YubiAdventure.tsx`: the word card currently uses the `uppercase` Tailwind class on the large word element. Switch to `lowercase` and render `word.toLowerCase()` so the text is lowercase even if CSS is overridden.
- `src/components/superadmin/prek/TimelinePreviewPlayer.tsx` line 124: replace `cardWord.toUpperCase()` with `cardWord.toLowerCase()`.
- `src/lib/preKLevelFromDb.ts`: normalize `w.word` to lowercase when mapping DB rows into the `VideoStep` shape, so any legacy uppercase rows render lowercase without a data migration.
- `src/data/preKAdventuresVideo.ts` / `src/data/preKAdventures.ts`: leave the stored constants as-is (they feed `YubiScene`'s uppercase switch and speech matching); lowercase only at the display layer.
- `src/lib/preKSceneGraph.ts` uses uppercase only for editor timeline labels — leave unchanged unless you want those lowercase too.
- `YubiScene.tsx` keeps `word.toUpperCase()` for picking the animation; that value is never rendered as text.
- Level builder word input: lowercase on save so new rows are stored lowercase.

## Not included

RPG battle mode word displays (`RPGWordReader`, `WordFeedbackOverlay`) still use uppercase syllable styling. Say the word and I'll flip those too.
