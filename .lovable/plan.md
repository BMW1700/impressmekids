

# Fix Agent Mode Visual Gaps

## What's Missing
Three components need updates so Agent Mode actually *looks* like Agent Mode during gameplay.

## Changes

### 1. RPGBattleBackground.tsx — Add agent world backgrounds
- Add new `BackgroundTheme` values: `'underground'`, `'neon_district'`, `'embassy'`, `'syndicate_hq'`
- Add corresponding render functions with urban/neon/diplomatic/dark gradients and environment elements
- Map agent world numbers (1-4) to these new themes

### 2. RPGCharacterSprite.tsx — Render agent heroes in battle
- Extend `CharacterType` to include `'agent_x'`, `'cipher'`, `'shadow_agent'`
- Add render branches that use the existing AgentX, Cipher, Shadow SVG components with battle animation states
- Wire the character mapping so selecting an agent hero in character select shows the correct sprite in battle

### 3. BossSilhouettes.tsx — Agent boss silhouettes for world map
- Create 4 new silhouette components: `BrokerSilhouette`, `ArchitectSilhouette`, `DoubleAgentSilhouette`, `DirectorSilhouette`
- Spy-themed SVG silhouettes (suited figure, tech helmet, double-faced, commanding figure)
- Update RPGWorldMap's `BossSilhouette` component to render agent bosses when theme is `'agent'`

### 4. Wire theme context into BossSilhouette rendering
- The world map's `BossSilhouette` component needs to check `getStoredTheme()` and switch between classic and agent silhouettes

## Files Modified
1. `src/components/aura/game/rpg/RPGBattleBackground.tsx` — 4 new background themes
2. `src/components/aura/game/rpg/RPGCharacterSprite.tsx` — 3 new character types
3. `src/components/aura/game/characters/BossSilhouettes.tsx` — 4 new silhouettes + exports
4. `src/components/aura/game/rpg/RPGWorldMap.tsx` — theme-aware boss silhouette rendering
5. `src/components/aura/game/characters/index.ts` — export new silhouettes

