

# Brutally Honest: Current State of Agent Mode

## What's WORKING ✓
1. **RPGCharacter.tsx** — sprite mapping is correct. Agent heroes map to `agent_x`, `cipher`, `shadow_agent` sprites when theme is `'agent'`. Agent enemy IDs are in the `idMap`.
2. **RPGBattleArena.tsx** — imports `getAgentHero`, `getAgentEnemy`, `getAgentBossForWorld`. Hero loading, enemy spawning, and enemy transitions all check `getStoredTheme()` and branch correctly.
3. **AuraReadingSection.tsx** — stories, worlds, and campaign data all swap to agent versions when theme is `'agent'`. Story passthrough to battle arena works.
4. **Premium sprite rendering** — `AgentX`, `Cipher`, `Shadow` components are imported and have render branches.

## What's STILL BROKEN

### Bug: "Dragon" enemy crashes agent mode logic
When a guard or elite level spawns, `buildEnemyQueue()` (line 118-125) adds `'dragon'` as a second enemy. In agent mode, `getAgentEnemy('dragon')` hits the `default` case and returns a **Street Thug** — a weak minion instead of a tough second enemy. This means:
- Guard/elite agent battles have a laughably easy second fight
- The enemy name/stats make no sense narratively (a street thug appearing after a Hired Gun)

### Fix
Add a `'dragon'` case to `getAgentEnemy()` in `agentBattleData.ts` that returns an appropriate agent-mode equivalent (e.g., a Drone Sentry or similar mid-tier enforcer). Alternatively, update `buildEnemyQueue` in `RPGBattleArena.tsx` to use an agent-appropriate enemy type instead of `'dragon'` when theme is agent.

## Verdict
**95% wired correctly.** The one remaining bug is the dragon-fallthrough in agent enemy queues. Everything else — hero data, enemy data, sprites, stories, backgrounds, silhouettes — is connected end-to-end.

### Fix Plan
**Single file: `src/lib/agentBattleData.ts`**
- Add `case 'dragon': return { ...cyberHacker };` (or a new agent enemy) to `getAgentEnemy()` so guard/elite battles get a proper second enemy in agent mode.

