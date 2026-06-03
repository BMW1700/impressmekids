## Final Pre-K Polish Pass — "Patrick Demo" Ready

Scope: Pre-K worlds 101 / 102 / 103 only. Visual + copy only. K–12 combat, knight/wizard/goblin sprites, Castle Swarm, mic/speech, Hear buttons, stars, map nav, unlock logic, and existing Pre-K animation triggers are NOT touched. No DB, no routes, no new dependencies.

Priority order (per user): **Demo 3 first** — Echo Needs Help, Bobo Lost His Jump, Wake Up Nabu Village — then broader Pre-K polish.

### Files touched (4)

1. `src/components/aura/game/rpg/RPGOneWordReader.tsx` — village backdrop layer, redesigned Nabu Helper, stronger Echo bubble pop, Bobo jump payoff, dominant success message.
2. `src/components/aura/game/rpg/RPGLevelSelect.tsx` — Pre-K mission titles override the technical story title.
3. `src/lib/nabuStoryCopy.ts` — add `getNabuLevelTitle(worldId, levelId)` mission-title map; tighten success/prompt copy for the 3 demo levels.
4. `src/components/aura/game/rpg/RPGCharacterSprite.tsx` — small additive expression hints for Bobo (`sad`/`celebrating` mood layer) and Echo (`relieved` smile), gated by new optional `mood` prop; existing callers untouched.

No changes to: `RPGWordReader`, `RPGBattleArena`, `RPGCombatPhase`, Castle Swarm, `preKWordBanks`, `getPreKContent`, verb animation library, speech manager, mic hooks, star thresholds, unlock logic, or K–12 reader/level cards.

---

### 1. Demo Moment A — Echo Needs Help (W103 L1)

Reader (`RPGOneWordReader.tsx`):
- Echo's existing sound-bubble ring stays before success. Refine: soft cyan ring + 2 sparkle puffs only (no red, no mouth-blocking element). Confirm nothing reads as a gag.
- On `allDone`: animate the bubble scaling up (`scale: 1 → 1.4`) and fading out (`opacity → 0`) over 600ms — a clear "pop".
- Pass `mood="relieved"` to Echo's sprite when `allDone` (small smile + tiny blush layer added in `RPGCharacterSprite`, additive only).
- Success card already shows `nabuCopy.successMessage`. Make it dominant: scale the message in (spring, scale 0.8→1.05→1), and keep the small star pill in the top bar.

Copy (`nabuStoryCopy.ts`): keep current 103:1 prompt and success — already on-spec.

### 2. Demo Moment B — Bobo Lost His Jump (W102 L1)

Reader:
- Pre-success: keep dashed "lost bounce" arc. Add `mood="sad"` to Bobo sprite (small downturned mouth + worry dot, additive layer in sprite).
- On `allDone`: trigger a celebratory jump on Bobo's wrapper — replace the current generic `allDone` wiggle with a higher arc when `world.id === 102 && level.id === 1`: `y: [0, -40, 0, -28, 0]`, duration 1.4s, plus a sparkle trail (3 `✨` motion divs fading up). Add `mood="celebrating"` (open smile + arms-up cue via sprite).

Copy: keep current 102:1 prompt + success.

### 3. Demo Moment C — Wake Up Nabu Village (W101 L3)

Reader (existing village backdrop expanded, still behind characters, low contrast):
- Add: soft rolling-hill silhouette (1 SVG path, muted green), 1–2 drifting clouds (slow `x` translate), a soft dashed "path" line under houses, 2 tiny flower dots.
- Pre-success: hill, houses, sun all dimmed (`opacity 0.45`, `filter: grayscale(0.3) brightness(0.85)`).
- Post-success: morning glow overlay fades to full, sun brightens + glows (already wired), windows on each house light up (small yellow dots animate `opacity 0→1`), one cloud drifts off gently.
- Success message "Your voice woke up the village!" already configured.

### 4. Magical Nabu Helper redesign

Replace the current "🎤 inside bubble" with a friendly voice-buddy orb:
- Glowing pastel orb (cyan→emerald gradient, soft pulse) with a simple **smiling face** (two dot eyes + curved smile via inline SVG/divs), a small mic-sparkle accent (✨ instead of 🎤 as the primary icon), and floating sparkles.
- Preserve column footprint (`w-[118px] sm:w-[140px]`, height same), preserve `heroAttacking` pulse hook, keep position. K–12 still renders `<RPGCharacterSprite type="knight" />`.

### 5. Pre-K mission titles on level cards

`nabuStoryCopy.ts` — add:
```ts
getNabuLevelTitle(worldId, levelId): string | null
```
Returns short emotional titles per the user's examples:
- W101: Wake Up the Village · Find the First Sound · Light Up the Houses · Help the Sleepy Shushie · Big Day: Village Morning
- W102: Help Bobo Jump · Bobo Finds His Clap · Bobo Hops Again · Bobo's Silly Spin · Big Day: Bobo's Bounce Party
- W103: Echo Needs Help · Echo Finds Her Voice · Help Echo Say It · Echo Feels Brave · Big Day: Echo Lights Up

`RPGLevelSelect.tsx` — when `world.mode === 'prek'`, render the mission title instead of `level.story.title`. Keep word count, grade chip, stars, "Help with: Shushie" chip unchanged.

### 6. Sprite mood prop (additive, safe)

`RPGCharacterSprite.tsx`:
- Add optional `mood?: "sad" | "relieved" | "celebrating"` prop.
- In `renderBouncer` and `renderEchoBlob`, render a small sibling layer for the mouth/eye/blush variant when `mood` is set. No size/position/footprint change. No effect when `mood` is undefined → all existing callers untouched.

### 7. Constraints — explicitly untouched

K–12 reader (`RPGWordReader`), knight/wizard/goblin sprites for K–12 callers, all combat HP/shake/enemy logic for K–12, Castle Swarm, mic/speech recognition, `playCorrectPronunciation` (Hear button), star thresholds, map navigation, level unlock logic, verb animation library, Pre-K word banks, `getPreKContent`, RLS / DB.

### Risks & mitigations

- Village backdrop additions stay z-index behind characters; uses existing absolutely-positioned overlay div — no layout shift.
- Nabu Helper swap keeps the same wrapper `motion.div` and column dimensions, so `heroAttacking` pulse + future word-card layout are unaffected.
- `mood` prop is purely additive; absence preserves current visuals exactly for K–12 and other Pre-K levels.
- Bobo's celebratory jump only overrides `allDone` animation on W102 L1; other levels keep current wiggle.

### After implementation, summary delivered to user

- 4 files changed (listed above)
- Visual + copy diff per demo moment
- Confirmation K–12, mic, Hear, stars, navigation, unlocks untouched
