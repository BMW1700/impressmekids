

# Remaining Agent Mode Gaps — Brutally Honest

## What's DONE ✓
Hero/enemy sprites, health bars, backgrounds, spells, transitions, mini-game announcements, mastery text, dialogue, stories, comprehension questions, world map, boss silhouettes, character select — all agent-themed.

## What's STILL Classic-Only

### 1. RPGWordPowerUp — "Power Word" label with fantasy styling
`RPGWordPowerUp.tsx` shows a purple/indigo card with ✨ Sparkles icon and "Power Word" label. No theme awareness. In agent mode it should say "INTEL KEYWORD" or "DECODED TERM" with a cyan/slate tech aesthetic instead of purple fantasy glow.

### 2. RPGCommandMenu — "Magic" and "Defend" labels
Line 25: `label: 'Magic'` — in agent mode should be "Tech" or "Cyber". Line 26: `label: 'Defend'` — could be "Cover" or "Shield". These are hardcoded with no theme check. The sub-menu names (`getCharacterName`) ARE already themed (Tactics, Cyber Ops, Stealth Ops), but the top-level command buttons still say "Magic".

### 3. RPGStore — entirely fantasy-themed
- `SkinCharacter` type is `'valor' | 'elara' | 'ella'` — no agent heroes
- All store items are fantasy: "Fire Storm", "Blizzard", "Holy Light", "Golden Knight", "Shadow Wizard", "Dragon Slayer"
- Skins are for `character: 'valor'` and `character: 'elara'` only
- No agent skins (e.g., "Stealth Suit" for Agent X, "Holo-Visor" for Cipher)
- No agent powers (e.g., "EMP Blast", "Drone Strike")
- The store renders identically in both modes

### 4. RPGPlayerHUD — equipped skins only check valor/elara
Line 41: `equippedSkins` hardcodes `{ valor: ..., elara: ... }` — no agent hero skins.

### 5. VocabularyTracker — "Power Words from your adventures"
Line 410: `"Power Words from your adventures"` — should be "Decoded Intel from your missions" in agent mode. Line 528: `"Read stories to collect Power Words"` — should be "Complete missions to decode keywords".

### 6. POWER_COSTS — fantasy ability names
Line 176-189: `fireball`, `ice_shard`, `lightning`, `word_nova`, `healing_aura`, etc. These are internal IDs so less visible, but the names bleed through if shown anywhere.

## Priority Assessment

| Gap | Immersion Impact | Effort |
|-----|-----------------|--------|
| Command menu labels | HIGH — visible every battle | Tiny (5 lines) |
| Word PowerUp theming | MEDIUM — appears during reading | Small (15 lines) |
| Vocabulary Tracker text | LOW — only seen in menu | Tiny (5 lines) |
| Store items/skins | HIGH — entire store is fantasy | Large (new items + agent skin type) |
| HUD equipped skins | LOW — follows from store fix | Small |

## Fix Plan

### Phase 1: Quick text/theme fixes (do now)

**A. `RPGCommandMenu.tsx`** — Make command labels theme-aware. Import `getStoredTheme`. When agent: "Read" → "Brief", "Magic" → "Tech", "Defend" → "Cover", "Items" → "Gear".

**B. `RPGWordPowerUp.tsx`** — Import `getStoredTheme`. When agent: swap purple gradient for cyan/slate, change "Power Word" → "INTEL KEYWORD", change Sparkles icon to Crosshair/Target, change "+2 🪙" styling to tech blue, change "New word collected!" → "New keyword decoded!".

**C. `VocabularyTracker.tsx`** — Import `getStoredTheme`. When agent: "Word Collection" → "Intel Database", "Power Words from your adventures" → "Keywords decoded from missions", "Read stories to collect Power Words" → "Complete missions to decode keywords".

### Phase 2: Store theming (do now)

**D. `src/lib/gameEconomy.ts`** — Add `SkinCharacter` values for agent heroes: `'agent_x' | 'cipher' | 'shadow'`. Add agent store items:
- Powers: "EMP Blast", "Drone Strike", "System Override", "Data Wipe"
- Skins: "Stealth Suit" (Agent X), "Holo-Visor" (Cipher), "Shadow Cloak" (Shadow)

**E. `RPGStore.tsx`** — Import `getStoredTheme`. Filter store items by theme: show fantasy items in classic, agent items in agent. Or show all but label sections appropriately.

**F. `RPGPlayerHUD.tsx`** — When agent theme, populate `equippedSkins` with agent hero IDs instead of valor/elara.

## Files Modified
1. `src/components/aura/game/rpg/RPGCommandMenu.tsx` — themed command labels
2. `src/components/aura/game/rpg/RPGWordPowerUp.tsx` — themed power word card
3. `src/components/aura/game/rpg/VocabularyTracker.tsx` — themed vocabulary text
4. `src/lib/gameEconomy.ts` — agent store items + expanded SkinCharacter type
5. `src/components/aura/game/rpg/RPGStore.tsx` — theme-filtered store
6. `src/components/aura/game/rpg/RPGPlayerHUD.tsx` — agent equipped skins

