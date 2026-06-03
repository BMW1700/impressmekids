## Pre-K Emotional Polish Pass — Plan

Scope: Pre-K worlds 101/102/103 only. K–12, Castle Swarm, knight/wizard/goblin combat, mic, stars, unlocks, animations, and existing reading flow are NOT touched.

### Files to change

1. **`src/components/aura/game/rpg/RPGLevelSelect.tsx`** — make Pre-K cards non-combat.
2. **`src/components/aura/game/rpg/RPGOneWordReader.tsx`** — replace HP/enemy/knight UI with soft Pre-K equivalents.
3. **`src/components/aura/game/rpg/RPGCharacterSprite.tsx`** — refine Bobo & Echo plushiness; add Echo "stuck-in-bubble" and Bobo "lost bounce" states; add a friendly "Nabu Helper" replacement for the knight in Pre-K.
4. **`src/lib/nabuStoryCopy.ts`** — update per-level titles, prompts, success messages; add World 102 jump-level override.
5. **`src/lib/campaignData.ts`** — soften Pre-K world copy only (`description`, `lore`); leave IDs, structure, levels, enemy keys, thresholds untouched.

No DB, no new routes, no behavior changes.

### Detailed changes

**1. Level cards (Pre-K only)** — gate on `world.mode === 'prek'`:
- Hide the red `BOSS` pill on Pre-K boss level (id 5); show a soft pink `★ Big Day` chip instead.
- Replace the `Enemies:` label with `Help with:` and swap the enemy icon row for a single soft chip per level: `Sleepy Shushie` (W101), `Wiggle Shushie` (W102), `Sound Snatcher` (W103). No combat tile grid.
- Drop the red border/shadow on boss tile in Pre-K; keep gradient border instead.

**2. Reader screen (Pre-K = worlds 101/102/103)**:
- Remove the `{HP number} HP` text and red HP bar entirely (already conditionally hidden on 102/103 — extend to 101 by forcing `showCombatUI = false` for all Pre-K worlds).
- Add a soft progress meter under the friendly character labeled per world:
  - 101 → "Village Sound"
  - 102 → "Sound Magic"
  - 103 → "Sleepy Spell"
  Fill is `correctPhrases / phrases.length` (no health framing). Pastel gradient, no red.
- Friendly-creature name label uses cute Pre-K names:
  - 101: `Sleepy Shushie`
  - 102: `Bobo`
  - 103: `Echo`
- Replace the right-side knight column in Pre-K with a "Nabu Helper" visual: a small voice-shield orb / mic-sparkle sprite rendered via a new `<NabuHelper />` block inside `RPGCharacterSprite` (or inline SVG in the reader). Keep its motion hooks (`heroAttacking → pulse`) so existing animation triggers still fire — just visually no sword/knight. K–12 reader (`RPGWordReader` flow) keeps the knight; this swap is local to `RPGOneWordReader`.
- Make the success message dominant: when `allDone`, render `nabuCopy.successMessage` as the large hero text (already in place) and shrink the star pill.

**3. Per-level emotional staging**:

- **World 103 / Level 1 ("Echo Needs Help")** — add a glowing "sound bubble" ring overlay around Echo while `correctPhrases === 0`. Pure CSS/SVG ring + soft sparkle puffs; fades on first success. Already-existing helper/comforted animation stays.
- **World 102 / Level (jump)** — add `102:1` override in `nabuStoryCopy.ts`:
  - title: `Bobo Lost His Jump`
  - prompt: `Bobo forgot how to jump! Read 'jump' to help him bounce.`
  - success: `Bobo can jump again!`
  - Visually: show a small dashed "missing bounce" arc under Bobo until first success; existing jump verb animation handles the payoff.
- **World 101 / Level 3 ("Wake Up Nabu Village")** — add a lightweight village backdrop layer in the reader when `worldId === 101 && levelId === 3`: 2–3 simple SVG house silhouettes + a dim sun that brightens after success, soft clouds, warm morning glow gradient overlay. All decorative, no layout shift, sits behind characters.

**4. Copy updates in `nabuStoryCopy.ts`**:
- Refresh prompts/success messages to match exact strings requested (Echo bubble, Bobo jump, Village sun).
- Add a generic fallback success rotation pool: "Your voice helped!", "You brought the sound back!", "Nabu Village is brighter!"

**5. `campaignData.ts` Pre-K copy only**:
- W101 description: `Help wake up Nabu Village with your voice.`
- W102 description: `Help Bobo find his sounds!`
- W103 description: `Help Echo feel brave.`
- Lore lines reworded to remove "stole"/"lost her voice" combat connotation; keep magical-helping framing.

**6. Bobo & Echo plush refinement (`RPGCharacterSprite.tsx`)**:
- Tighten Bobo: rounder body silhouette, softer mitten shapes, simpler 2-tone shading (no extra detail layers) → reads as plush from silhouette.
- Tighten Echo: clearer floppy ears, bigger shy eyes, add a "stuck" prop variant (soft glowing ring around body, two sparkle puffs) gated by an `isStuck` prop only used in World 103 L1 pre-success.
- Preserve existing size, footprint, position, animation hooks (`isAttacking`, `isTakingDamage`, `action`, `actionNonce`).

**7. Constraints — explicitly untouched**:
- `RPGBattleArena`, `RPGCombatPhase`, `RPGWordReader` (K–12 reader), `RPGCharacterSprite.knight` for K–12 callers, Castle Swarm, mic/speech, stars, map nav, unlock logic, verb animation library, Pre-K word banks, `getPreKContent`.
- K–12 still shows `BOSS`, `Enemies:`, HP — guarded by `world.mode === 'prek'` checks.

### Risks
- The "Nabu Helper" swap in the reader is the most invasive visual change. Mitigation: keep the same column dimensions and motion wrapper so layout + `heroAttacking` pulse keep working; only the inner sprite changes.
- Village backdrop on W101 L3 is additive decoration behind characters — no z-index/layout impact.

### Summary delivered to user after build
- Bullet list of the 5 files edited
- Confirmation that K–12 combat, knight/wizard/goblin sprites, Castle Swarm, and mic/stars/unlock flow are untouched.
