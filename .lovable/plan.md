

# Agent Mode: Full Overhaul Plan

## Problems Identified

1. **AI backgrounds show K-5 content** — The `world_backgrounds` database table has 9 entries (IDs 0-8), all classic fantasy. Agent mode worlds (0-4) fetch the same DB rows, so "Enchanted Forest" and "Frozen Depths" images render in agent battles. Zero agent-specific background images exist.

2. **Stories are all spy/espionage themed** — All 24 agent stories are narrowly focused on espionage tradecraft (dead drops, encryption, surveillance). For high school students, the content should span diverse topics: literature, psychology, economics, philosophy, current events — not just spy briefings.

3. **Enemy sprites need more variety** — Only 5 unique agent enemy sprites exist. 7 agent enemy types (`drone_sentry`, `rogue_agent`, `bodyguard`, `operative`, `enforcer`, `the_architect`, `the_double_agent`) alias to one of the existing 5. Each should be visually distinct.

4. **Hero and enemy sprites could be more detailed** — Current agent SVGs are functional but simpler than the classic mode sprites (which have more visual elements, gradients, and animation states).

5. **Comprehension fill-in-the-blank questions** — User loves these and wants more added to both modes.

---

## Fix Plan

### Phase 1: Agent World Backgrounds (Database + Edge Function)

**Database migration**: Add 5 new rows to `world_backgrounds` for agent worlds (IDs 10-14) with mature, non-fantasy prompts:
- ID 10: "Training Facility" — modern military training complex, concrete, monitors
- ID 11: "The Underground" — dark city subway tunnels, graffiti, dim industrial lighting
- ID 12: "Neon District" — cyberpunk cityscape, holographic ads, rain-slicked streets
- ID 13: "The Embassy" — ornate diplomatic building interior, marble, chandeliers, tension
- ID 14: "Syndicate HQ" — dark corporate penthouse, red lighting, city skyline view

**Update `RPGBattleBackground.tsx`**: Change `worldToDbId` mapping for agent mode to point to these new DB IDs (10-14) instead of classic IDs (0-4).

**Trigger generation**: Call `generate-world-backgrounds` edge function to create the new images.

### Phase 2: Diversify Agent Stories

**Expand `agentStories.ts`** with diverse high-school-level topics (not all spy). Each world keeps its narrative frame but stories cover broad subjects:

- **World 1 (The Underground)**: Urban sociology, criminal psychology, economics of black markets, investigative journalism, civil liberties
- **World 2 (Neon District)**: AI ethics, quantum computing, social media manipulation, digital privacy, neuroscience
- **World 3 (The Embassy)**: Constitutional law, international relations, rhetoric & persuasion, moral philosophy, historical revolutions
- **World 4 (Syndicate HQ)**: Game theory, leadership psychology, whistleblower ethics, media literacy, statistical reasoning

This means rewriting ~18 of the 24 stories to cover diverse academic topics while maintaining narrative continuity through the spy mission frame (briefing-style intros that transition into the actual educational content).

### Phase 3: More Enemy Sprites (4 new components)

Create 4 additional agent enemy SVG components so every enemy type has a unique sprite:

1. **`DroneSentry.tsx`** — hovering quadcopter drone with scanning laser, metallic/gray
2. **`RogueAgent.tsx`** — trenchcoat figure with dual pistols, dark blue/black
3. **`Bodyguard.tsx`** — massive suited figure with earpiece, broad shoulders, black/white
4. **`TheArchitect.tsx`** — figure with holographic displays orbiting them, blue/indigo (boss)

Update `RPGCharacter.tsx` `idMap` so `drone_sentry`, `rogue_agent`, `bodyguard`, `operative` → unique sprites instead of aliases. Add `the_architect` as distinct from `cyber_hacker`.

### Phase 4: Enhance Existing Sprites

Upgrade the 5 existing agent enemy sprites + 3 hero sprites with:
- More SVG detail (belts, pouches, scars, insignias, environmental effects)
- Additional animation states (dodge, special attack)
- Glow effects and ambient particles matching their theme
- Larger viewBox for bosses to feel more imposing

### Phase 5: More Comprehension Fill-in-the-Blank Questions

Add more context-clue / fill-in-the-blank sentence sets to both modes' story data, increasing the pool of comprehension questions that pop up during combat. These will use vocabulary from the current story being read.

---

## Files Modified/Created

1. **Database migration** — Add agent world_backgrounds rows (IDs 10-14)
2. `src/components/aura/game/rpg/RPGBattleBackground.tsx` — agent-mode DB ID mapping
3. `src/data/agentStories.ts` — rewrite ~18 stories with diverse topics
4. `src/components/aura/game/characters/DroneSentry.tsx` — NEW
5. `src/components/aura/game/characters/RogueAgent.tsx` — NEW
6. `src/components/aura/game/characters/Bodyguard.tsx` — NEW
7. `src/components/aura/game/characters/TheArchitect.tsx` — NEW
8. `src/components/aura/game/characters/index.ts` — export new components
9. `src/components/aura/game/rpg/RPGCharacter.tsx` — wire new sprites, update aliases
10. Existing sprite files (AgentX, Cipher, Shadow, StreetThug, HiredGun, CyberHacker, TheBroker, TheDirector) — visual upgrades
11. `src/data/agentStories.ts` + `src/data/curatedStories.ts` — more fill-in-the-blank vocab sets

## Execution Order
Phases 1-2 first (backgrounds + stories — highest visual impact), then Phase 3-4 (sprites), then Phase 5 (comprehension questions). This is a large change set and may need to be split across multiple implementation rounds.

