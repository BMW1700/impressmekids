## 1. Grant super_admin access to jacob.besser0@gmail.com

Insert into `public.user_roles`:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('c69298fa-8421-451b-94ab-3fb52d0fabea', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

This unlocks the Super Admin CMS (Pre-K Worlds/Levels builder, R2 migration, etc.) where Benny episodes/levels are authored.

## 2. Platform-wide Nabu → Yubi rename

Case-preserving find/replace across all code + data. 35 files, ~270 occurrences.

### 2a. User-visible strings (highest priority)
Every `Nabu` in copy → `Yubi`, `NABU` → `YUBI`, `nabu` → `yubi`. Files: `nabuStoryCopy.ts`, `campaignData.ts`, `preKAdventures.ts`, `preKWordBanks.ts`, `NabuScene.tsx`, `NabuPreKStoryScene.tsx`, `NabuAdventure.tsx`, `NabuBubble.tsx`, `NabuOwl.tsx`, `NabuProblemScene.tsx`, `NabuEpisodeIntroOverlay.tsx`, `NabuEpisodeOutroOverlay.tsx`, `NabuVideoAdventure.tsx`, `RPGOneWordReader.tsx`, `RPGLevelSelect.tsx`, `RPGWorldMap.tsx`, `ThemeSelector.tsx`, `SettingsMenu.tsx`, `PremiumHero.tsx`, `BennyVideoHero.tsx`, `ForFamilies.tsx`, `GameDashboard.tsx`, `AuraPractice.tsx`, `tts.ts` (pronunciation hints), `preKSceneGraph.ts`, `usePreKAudioMixerRuntime.ts`, `PreKWorldsList.tsx`, `PreKLevelBuilder.tsx`, edge functions (`auth-email-hook`, `sign-r2-audio-url`, `migrate-to-r2`).

### 2b. Identifiers & filenames
Rename symbols and files so the codebase itself no longer says Nabu:
- Components: `NabuOwl` → `YubiOwl`, `NabuBubble` → `YubiBubble`, `NabuScene` → `YubiScene`, `NabuProblemScene` → `YubiProblemScene`, `NabuPreKStoryScene` → `YubiPreKStoryScene`, `NabuAdventure` → `YubiAdventure`, `NabuVideoAdventure` → `YubiVideoAdventure`, `NabuEpisodeWrapper` → `YubiEpisodeWrapper`, `NabuEpisodeIntroOverlay` / `NabuEpisodeOutroOverlay` → `Yubi*`.
- Page: `src/pages/game/NabuVillage.tsx` → `YubiVillage.tsx` (plus route/import update in `App.tsx`, `GameDashboard.tsx`).
- Lib: `nabuStoryCopy.ts` → `yubiStoryCopy.ts`; exported functions `getNabuCreatureName`, `getNabuMeterLabel`, `getNabuHelpChip`, `getNabuLevelTitle`, `getNabuLevelCopy`, `isNabuPreKWorld`, `getNabuDemoWords` → `getYubi*` / `isYubiPreKWorld`.
- Demo flag: URL param `?nabu_demo=1` and localStorage key `nabu_prek_demo` → `yubi_demo` / `yubi_prek_demo` (breaking for anyone who set the old flag — acceptable, internal demo only).
- Poster asset pointer `nabu-hero-poster.jpg.asset.json` left in place (only referenced by nothing now that the hero video import is `yubi-hero.mp4.asset.json`); will delete via `lovable-assets delete` if unreferenced after rename.

### 2c. Database content
One migration:

```sql
UPDATE public.prek_worlds
SET title = 'Yubi Village'
WHERE id = '04420500-93a3-4836-aed4-3c9aa9efc62e' AND title = 'Nabu Village';
```

(A full-text sweep confirmed this is the only "Nabu" string in `prek_worlds`, `prek_levels`, or `prek_level_words`.)

### 2d. Route
If `/nabu-village` or similar route exists in `App.tsx`, add a redirect from the old path to `/yubi-village` so any bookmarks still work.

## Out of scope
- Asset URLs already uploaded to R2 that contain "nabu" in the filename (e.g. `nabu-hero-poster.jpg`) — the URLs are immutable; the pointer JSON file can be renamed but the CDN path stays. Not user-visible.
- Migration filenames under `supabase/migrations/` are historical and never displayed; left as-is.
- `mem://` memory files mentioning Nabu (internal to the AI, not user-facing) — left as-is.

## Verification
- `rg -i nabu src/ supabase/functions/` returns zero hits after the rename (aside from historical migration files).
- Load `/for-families`, mode-select, and a Pre-K episode; confirm all copy says "Yubi".
- Sign in as Jacob and confirm the Super Admin dashboard is reachable.
