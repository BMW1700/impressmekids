

## Fix Plan: Broker Health Bar, Victory Sound Glitch, Stats, & Store Powers

### Issues Identified

**1. ALL Agent Mode Characters Missing Health Bars (35 files)**
The `RPGCharacter` component hides its built-in HP bar when `usePremiumSprites=true` (line 911), expecting each premium sprite to render its own. Classic mode characters (GoblinGuard, CaveTroll, etc.) do this correctly. But **every single Agent mode character** — all 15 bosses (TheBroker, TheArchitect, TheDirector, etc.) and all 20 minions (StreetThug, HiredGun, CyberHacker, etc.) — accepts `showHealthBar` as a prop but never renders a health bar. This is why The Broker has no visible HP.

**2. Glitchy Victory Sound**
When victory triggers, `celebrationSound()` fires from mini-game completion handlers AND from `triggerVictory` path simultaneously. The `celebrationSound()` method plays 4 simultaneous tones (C, E, G, high C) with no rate limiting. Multiple overlapping calls create a harsh, distorted chord. Additionally, there's no dedicated victory sound — only the same `celebrationSound()` used for mini-game completions.

**3. Inflated Victory Stats**
The `totalDamage` counter accumulates damage from every source: reading, mini-games, spells, bonus damage — without any cap. For a boss with 200-500 HP, showing "40,910 Damage" is confusing and feels broken. The display should show meaningful stats.

**4. Store Powers Already Work — Need Visual Verification**
The store power system is wired: purchased powers map to spell effects via `effectMap`, get proper sound effects, and trigger `RPGSpellEffects` animations. The effects (fire, ice, lightning, slash, nature, wind, data_burst, heal) all have corresponding particle animations. This appears functional but the animations may feel generic since all purchased powers of the same element share one visual.

---

### Fix Details

**File Group 1: Add Health Bars to ALL 35 Agent Mode Characters**
Apply the standard health bar template (from GoblinGuard) to each file. The template is ~25 lines, inserted after the closing `</svg>` tag and before the closing `</motion.div>`:
- Destructure `showHealthBar` from props (most already accept it but ignore it)
- Add the health bar div with HP text, colored progress bar, and animation

Files (15 bosses): `TheBroker.tsx`, `TheArchitect.tsx`, `TheDirector.tsx`, `TheDoubleAgent.tsx`, `TheWarden.tsx`, `TheCommander.tsx`, `ThePhantom.tsx`, `TheOverseer.tsx`, `TheVaultKeeper.tsx`, `TheShadowBroker.tsx`, `TheFrostbite.tsx`, `TheMinotaur.tsx`, `TheCatalyst.tsx`, `TheOmega.tsx`, `TheLibrarian.tsx`

Files (20 minions): `StreetThug.tsx`, `HiredGun.tsx`, `CyberHacker.tsx`, `DroneSentry.tsx`, `RogueAgent.tsx`, `Bodyguard.tsx`, `Operative.tsx`, `Enforcer.tsx`, `VaultSentinel.tsx`, `VaultDrone.tsx`, `ShadowOperative.tsx`, `ShadowDrone.tsx`, `FrostTrooper.tsx`, `IceDrone.tsx`, `MazeRunner.tsx`, `TunnelRat.tsx`, `LabGuard.tsx`, `BioDrone.tsx`, `OmegaSoldier.tsx`, `OmegaElite.tsx`

**File 2: `src/lib/pronunciationPlayer.ts`**
- Add a `lastCelebrationTime` tracker to prevent overlapping celebration sounds (minimum 2s gap)
- Create a proper `victoryFanfare()` method with staggered ascending notes instead of a flat chord

**File 3: `src/components/aura/game/rpg/RPGBattleArena.tsx`**
- Cap `totalDamage` display in the victory screen to `enemy.maxHp` (or sum of all enemy maxHp if multi-enemy) — the stat should reflect effective damage, not accumulated overkill
- Replace `celebrationSound()` on victory with `victoryFanfare()`
- De-duplicate celebration sound calls: only play once in `triggerVictory`, remove from individual mini-game handlers that also call `triggerVictory`

