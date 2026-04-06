

# Plan: Agent Mode Minigame Customization

## Current State
Out of ~20 minigames, only **RPGGoblinHorde** has agent-mode theming (swaps goblins for operatives). All other minigames use pure fantasy aesthetics — blue/purple gradients, "SHIELD," "SPELL," "MAGIC" labels, sparkle icons — regardless of mode.

## What Changes

### 1. Create a shared minigame theme utility
**New file: `src/lib/minigameTheme.ts`**

A single source of truth that maps each minigame to mode-specific:
- **Title** (e.g. "Spell Combo" → "Hack Sequence")
- **Subtitle/flavor text** (e.g. "Channel arcane energy!" → "Bypass encryption!")
- **Color scheme** (fantasy purple/blue → tactical cyan/slate/red)
- **Icon choice** (Sparkles/Shield → Crosshair/Terminal/Wifi)
- **Success/failure messages** (e.g. "SPELL COMPLETE!" → "SYSTEM BREACHED!")

This keeps each component's diff small — they just import and branch on one `isAgent` flag.

### 2. Re-skin each minigame component

Every minigame gets the same pattern: `const isAgent = getStoredTheme() === 'agent';` at the top, then swap titles, gradient classes, icons, and feedback text.

| Minigame | Classic Theme | Agent Theme |
|---|---|---|
| **WordShield** | "Word Shield" / blue-purple gradients / Shield icon | "Firewall" / cyan-slate gradients / Lock icon |
| **SpellCombo** | "Spell Combo" / purple sparkles / magic chain | "Hack Sequence" / green terminal text / code chain |
| **DodgeWords** | "Dodge!" / fantasy projectiles | "Evade Surveillance" / red laser grid |
| **RhymeChain** | "Rhyme Chain" / music notes / pink-purple | "Code Pattern" / cipher links / cyan-teal |
| **SpeedTypist** | "Speed Cast" / flame trail | "Rapid Decode" / digital countdown / amber-cyan |
| **FireballDefense** | "Fireball Defense" / fire colors | "Missile Defense" / military red-orange |
| **BeastSwarm** | "Beast Swarm" / forest creatures | "Drone Swarm" / mechanical drones |
| **AsteroidBarrage** | "Asteroid Barrage" / space rocks | "Data Breach" / falling data packets |
| **GroundRipple** | "Ground Ripple" / earth tones | "Shockwave" / tech pulse effect |
| **GhostlyWhispers** | "Ghostly Whispers" / ethereal | "Intercepted Comms" / radio static |
| **IceCrystalBarrage** | "Ice Crystal" / frost blue | "EMP Burst" / electric blue-white |
| **RollingBoulders** | "Rolling Boulders" / brown-earth | "Incoming Ordnance" / military grey-red |
| **VoidPull** | "Void Pull" / dark purple vortex | "Gravity Trap" / tech black-cyan |
| **CrystalPrison** | "Crystal Prison" / ice blue | "Containment Field" / energy grid |
| **WordBarrage** | "Word Barrage" / generic | "Intel Barrage" / tactical |
| **VocabShield** | "Word Shield" / red glow | "Encryption Lock" / cyan glow |
| **WordEcho** | "Word Echo" / cave echoes | "Signal Bounce" / radar ping |
| **WindChase** | "Wind Chase" / breezy | "Pursuit Mode" / sprint tracker |
| **InkSplash** | "Ink Splash" / underwater | "Redacted Files" / censored docs |
| **LightningStorm** | "Lightning Storm" / electric | "Power Surge" / grid overload |
| **WebTrap** | "Web Trap" / spider web | "Laser Grid" / security beams |

### 3. Update gradient/color classes per mode

- **Classic**: Keep existing gradients (blue, purple, amber, green palettes)
- **Agent**: Use tactical palette — `slate-900`, `cyan-500`, `red-600`, `emerald-500` for success, dark backgrounds with neon accents

### 4. Files to modify (~20 files)

Each file gets a small diff (5-20 lines changed per file):
- `src/components/aura/game/rpg/RPGWordShield.tsx`
- `src/components/aura/game/rpg/RPGSpellCombo.tsx`
- `src/components/aura/game/rpg/RPGDodgeWords.tsx`
- `src/components/aura/game/rpg/RPGRhymeChain.tsx`
- `src/components/aura/game/rpg/RPGSpeedTypist.tsx`
- `src/components/aura/game/rpg/RPGFireballDefense.tsx`
- `src/components/aura/game/rpg/RPGBeastSwarm.tsx`
- `src/components/aura/game/rpg/RPGAsteroidBarrage.tsx`
- `src/components/aura/game/rpg/RPGGroundRipple.tsx`
- `src/components/aura/game/rpg/RPGGhostlyWhispers.tsx`
- `src/components/aura/game/rpg/RPGIceCrystalBarrage.tsx`
- `src/components/aura/game/rpg/RPGRollingBoulders.tsx`
- `src/components/aura/game/rpg/RPGVoidPull.tsx`
- `src/components/aura/game/rpg/RPGCrystalPrison.tsx`
- `src/components/aura/game/rpg/RPGWordBarrage.tsx`
- `src/components/aura/game/rpg/RPGVocabShield.tsx`
- `src/components/aura/game/rpg/RPGWordEcho.tsx`
- `src/components/aura/game/rpg/RPGWindChase.tsx`
- `src/components/aura/game/rpg/RPGInkSplash.tsx`
- `src/components/aura/game/rpg/RPGLightningStorm.tsx`
- `src/components/aura/game/rpg/RPGWebTrap.tsx`
- New: `src/lib/minigameTheme.ts`

### 5. What stays the same
- Game mechanics, timers, scoring, speech recognition — all unchanged
- Only visual text, colors, icons, and flavor messages change per mode

