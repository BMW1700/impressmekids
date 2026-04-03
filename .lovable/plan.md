

# Agent Mode Polish: Health Bars, Spells, Sprites & Story Fixes

## Problems Identified

### 1. Enemy health bars missing
Agent enemy sprites (`StreetThug`, `HiredGun`, `CyberHacker`, `DroneSentry`, `RogueAgent`, `Bodyguard`) have NO built-in health bar. The `RPGCharacter.tsx` component (line 651) hides the fallback HP bar when `usePremiumSprites=true`, assuming premium sprites render their own. Only boss sprites (`TheBroker`, `TheDirector`, `TheArchitect`) and hero sprites have health bars built in.

### 2. No agent-specific spells/powers
`RPGCommandMenu.tsx` line 47-53 only handles `valor`, `elara`, `ella` character IDs for spell selection. Agent heroes fall through to default `elaraSpells` (Lightning Bolt, Ice Shard, Fireball — fantasy spells). No agent-themed powers exist (e.g., Cipher's plasma number attack).

### 3. Sprites look childish
Current agent enemy SVGs are simple with minimal detail — basic shapes, few gradients, minimal accessories, no ambient effects. They lack the polish of classic mode sprites like `GrogTheKing` or `DrakeTheDragon`.

### 4. Stories have blank spaces where words should be
The em-dash character `—` in story passages (used extensively in agent stories) gets treated as a word by `split(/\s+/)` in the word reader (line 460). When the player encounters `—` as a "word to read," it shows as a blank/unpronounceable token, breaking immersion. This affects stories like "Criminal Psychology" (line 21: `— the idea that`), "Civil Liberties" (line 45: `— that those who`), etc. Nearly every agent story contains em-dashes.

---

## Fix Plan

### A. Add health bars to ALL agent enemy sprites (6 files)
Add `showHealthBar` prop + built-in health bar rendering to: `StreetThug.tsx`, `HiredGun.tsx`, `CyberHacker.tsx`, `DroneSentry.tsx`, `RogueAgent.tsx`, `Bodyguard.tsx`. Follow the same pattern used in `Cipher.tsx` (lines 143-161) — a bottom-positioned bar with gradient color based on health percent + HP text.

### B. Create agent-specific spell sets (2 files)
**`RPGSpellMenu.tsx`**: Add three new spell arrays:
- `agentXSpells`: Tactical Strike (slash), Flashbang (lightning), Precision Shot (fire)
- `cipherSpells`: **Data Burst** (plasma numbers — "fire" effect but themed), System Hack (lightning), Firewall (ice/shield)
- `shadowSpells`: Shadow Strike (slash), Smoke Bomb (wind), Assassination (fire — high damage)

**`RPGCommandMenu.tsx`**: Update `getCharacterSpells()` and `getCharacterName()` to handle agent character IDs and return agent spell sets. Detect agent theme and map accordingly.

### C. Fix em-dash word splitting (1 file)
**`RPGBattleArena.tsx`** line 460: Update the word split regex to strip em-dashes, en-dashes, and other non-word punctuation tokens before filtering:
```
story.passage_text.split(/\s+/).filter(w => w.length > 0 && !/^[\u2014\u2013\-—–]+$/.test(w))
```
This removes `—` tokens from the word queue so players never encounter unpronouceable blanks.

### D. Upgrade agent enemy sprites for mature, polished look (6 files)
Enhance each of the 6 agent enemy SVGs with:
- More detailed SVG elements (gear, scars, accessories, weapon details)
- Gradient fills and subtle glow effects
- Ambient animated elements (breathing, aura shimmer)
- Proportions more adult/realistic (taller, less round)

### E. Upgrade agent hero sprites (3 files)
Polish `AgentX.tsx`, `Cipher.tsx`, `Shadow.tsx` with:
- More SVG detail (weapon holsters, tech accessories, insignias)
- Cipher: Add floating holographic number particles in idle state
- Better proportions matching the mature theme

---

## Files Modified
1. `src/components/aura/game/characters/StreetThug.tsx` — health bar + visual upgrade
2. `src/components/aura/game/characters/HiredGun.tsx` — health bar + visual upgrade
3. `src/components/aura/game/characters/CyberHacker.tsx` — health bar + visual upgrade
4. `src/components/aura/game/characters/DroneSentry.tsx` — health bar + visual upgrade
5. `src/components/aura/game/characters/RogueAgent.tsx` — health bar + visual upgrade
6. `src/components/aura/game/characters/Bodyguard.tsx` — health bar + visual upgrade
7. `src/components/aura/game/characters/AgentX.tsx` — visual upgrade
8. `src/components/aura/game/characters/Cipher.tsx` — visual upgrade + floating numbers
9. `src/components/aura/game/characters/Shadow.tsx` — visual upgrade
10. `src/components/aura/game/rpg/RPGSpellMenu.tsx` — agent spell arrays
11. `src/components/aura/game/rpg/RPGCommandMenu.tsx` — agent spell routing
12. `src/components/aura/game/rpg/RPGBattleArena.tsx` — em-dash word filter fix

## Execution Order
1. Fix em-dash bug (highest priority — breaks immersion)
2. Add enemy health bars (critical gameplay bug)
3. Add agent spells (gameplay completeness)
4. Upgrade sprites (visual polish)

