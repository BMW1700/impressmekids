

# Brutally Honest: What's Left for Agent Mode Parity

## Already Fixed ✓
- Hero/enemy data wiring, sprites, health bars, backgrounds from DB
- Em-dash word filter, agent stories, comprehension questions
- Mini-game announcement text (themed: "HOSTILE SQUAD", "MISSILES", "DRONE SWARM")
- Enemy transition screen (themed: "PRIORITY TARGET DETECTED", crosshair icons)
- Word mastery text ("INTEL DECODED")
- Cipher charge text ("COMPILING" / "DATA BURST DEPLOYED")
- Special barrage names ("MALWARE SWARM", etc.)
- Literacy mini-game messages ("FIREWALL BARRIER", "ENCRYPTION", "SIGNAL JAM")
- Boss silhouettes, character select, world map — all theme-aware

## What's STILL Not Right

### 1. Mini-game VISUALS are fantasy (THE BIGGEST GAP)
When agent enemies trigger `goblin_horde`, `beast_swarm`, or `fireball_defense`, the player sees:
- **Cartoon goblins** (green SVG sprites with pointy ears) running at them
- **Fire imps, shadow bats, frost sprites** (🔥🦇❄️ emojis)
- **Fireballs** raining down

The announcement text says "HOSTILE SQUAD" but the visuals show goblins. This is the single biggest immersion break remaining. Three components need agent-mode awareness:
- `RPGGoblinHorde` → should show soldiers/operatives
- `RPGBeastSwarm` → should show drones
- `RPGFireballDefense` → should show missiles/rockets

### 2. Victory/Defeat screens are generic
- Victory shows a Trophy icon and "VICTORY!" — fine for both modes
- Defeat shows a Skull and "DEFEAT" and "{enemy.name} was too powerful..." — also fine
- But agent mode could say "MISSION COMPLETE" / "MISSION FAILED" and "Return to HQ" instead of "Return to Map"
- Minor polish, not a deal-breaker

### 3. No agent-specific mini-games yet
You mentioned wanting Safe Breaker, Code Decrypt, etc. — those don't exist yet. Currently agent mode uses the exact same mini-game pool as classic.

## Priority Assessment

| Gap | Impact | Effort |
|-----|--------|--------|
| Fantasy mini-game visuals | HIGH — goblins in a spy mission | Medium (3 component updates) |
| Victory/defeat text | LOW — generic text works | Tiny (10 lines) |
| New agent mini-games | HIGH — differentiation | Large (new components) |

## Fix Plan

### Phase 1: Theme-aware mini-game visuals (do now)
Update the 3 existing mini-game components to accept a `theme` prop:

**`RPGGoblinHorde.tsx`**: When `theme === 'agent'`, replace `MiniGoblin` SVG with an `AgentOperative` SVG (dark tactical figure). Change "Goblin" labels to "Operative". Swap green/purple colors for slate/red tactical colors.

**`RPGBeastSwarm.tsx`**: When `theme === 'agent'`, replace beast types (`fire_imp` → `attack_drone`, `shadow_bat` → `recon_drone`, `frost_sprite` → `emp_drone`). Swap emojis (🔥→🤖, 🦇→📡, ❄️→⚡). Change gradient colors to tech blues/grays.

**`RPGFireballDefense.tsx`**: When `theme === 'agent'`, render missiles instead of fireballs. Swap orange/red gradients for gray/steel colors. Change "fireball" labels to "missile".

**`RPGBattleArena.tsx`**: Pass `theme={getStoredTheme()}` to all three components.

### Phase 2: Victory/defeat text (do now)
In `RPGBattleArena.tsx`, when agent theme:
- Victory: "MISSION COMPLETE" instead of "VICTORY!", "Target neutralized" instead of "You defeated"
- Defeat: "MISSION FAILED" instead of "DEFEAT", "Return to HQ" instead of "Return to Map"

### Phase 3: New agent mini-games (future round)
Safe Breaker, Code Decrypt, Drone Intercept — entirely new game components for agent mode differentiation. This is too large for this round.

## Files Modified
1. `src/components/aura/game/rpg/RPGGoblinHorde.tsx` — agent operative reskin
2. `src/components/aura/game/rpg/RPGBeastSwarm.tsx` — drone reskin
3. `src/components/aura/game/rpg/RPGFireballDefense.tsx` — missile reskin
4. `src/components/aura/game/rpg/RPGBattleArena.tsx` — pass theme to mini-games + victory/defeat text
5. `src/components/aura/game/rpg/MiniGoblin.tsx` — add agent variant OR create new `MiniOperative.tsx`

