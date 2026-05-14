# Fix Pre-K Reader: Mic, Visual Consistency, Readability

## What's wrong (from your screenshots)

1. **No mic.** It's a "tap I read it!" button — kids can lie or tap through. Every other AURA screen uses real speech recognition.
2. **Looks nothing like the rest of the game.** Bare gradient, no battle frame, no HP/power bars, no "battle arena" chrome. Bouncer/Wiggleworm are floating on a blank field.
3. **Word card is too sterile / hard to scan.** Tiny "Word 1 of N" header, plain white card, no syllable break, no emoji hint, no visual rhythm with the rest of the app.

The root cause: I built `RPGOneWordReader.tsx` from scratch with custom Hear it / I read it! / Skip buttons instead of reusing **`RPGWordReader.tsx`** — the 1,470-line component every other battle uses, which already has mic management, echo retry, speech matching, mic troubleshooter, emoji pops, and feedback overlay.

## The fix — one focused refactor

Rebuild `RPGOneWordReader.tsx` to be a **Pre-K-skinned battle screen** that wraps the real `RPGWordReader`.

### Layout (matches RPGBattleArena visual language)

```text
┌────────────────────────────────────────────────────┐
│  ← Map        World 1 · Level 2        ⭐ 3/5      │  ← top bar (same as battle)
├────────────────────────────────────────────────────┤
│  ╔══════════════════════════════════════════════╗  │
│  ║  [Wiggleworm]                    [Knight]    ║  │  ← character row, same sprite sizes
│  ║   Wiggleworm                     You got it! ║  │     as battle arena
│  ║                                               ║  │
│  ║          ┌──────────────────────┐             ║  │
│  ║          │                      │             ║  │
│  ║          │       JUMP           │             ║  │  ← BIG word card, lowercase
│  ║          │       jump           │             ║  │     w/ phonetic hint below
│  ║          │       j • u • mp     │             ║  │
│  ║          │   ✨ Watch what       │             ║  │
│  ║          │      happens!        │             ║  │
│  ║          └──────────────────────┘             ║  │
│  ║                                               ║  │
│  ║   [🎤 Listening... say it!]    [🔊 Hear it]   ║  │  ← REAL mic, animated pulse
│  ║                                               ║  │
│  ║   ●●●○○  word 3 of 5                          ║  │  ← progress dots
│  ╚══════════════════════════════════════════════╝  │
│  Battle-frame border + soft shadow (same as arena) │
└────────────────────────────────────────────────────┘
```

### Behavior

- **Speech recognition is the primary input.** Use `RPGWordReader` directly with `words={preKWords}`, `batchSize={preKWords.length}`, `enableEchoRetry={true}`, `mode="fast"` (Pre-K = lenient matching).
- **`onResult(correct, ...)`**: on correct → fire `triggerVerb(word)` so Bouncer/Wiggleworm/Echo do their animation, then `RPGWordReader` auto-advances. On wrong → echo-retry kicks in (already built into the reader).
- **`onBatchComplete(results)`**: compute stars from `results.filter(r => r.result === 'correct').length / results.length` and call `onComplete`.
- **"Hear it" button** stays — calls `playCorrectPronunciation(currentWord)` (TTS).
- **No "I read it!" or "Skip" buttons.** Pre-K kids prove they read it by saying it; teachers can hold the mic for shy kids.
- **Mic permission prompt:** reuse `MicTroubleshooterModal` (already wired into `RPGWordReader`).

### Visual consistency with battle arena

- Wrap stage in the same `RPGBattleBackground` component the arena uses, with a Pre-K background variant (soft cloud/meadow scene, not the dark dungeon). Add `bg_meadow_pink`, `bg_meadow_yellow`, `bg_meadow_green` to `RPGBattleBackground.tsx` keyed off `world.id` 101/102/103.
- Same character sprite sizing (`size="lg"`), same drop-shadow, same idle-bob animation as arena.
- Word card: white rounded-3xl card with the same shadow/border treatment as `RPGCharacterSprite` name plates. Show the word in **lowercase 8xl** (kids learn lowercase first), with a smaller syllable hint (`j • u • mp`) below in muted color, and the purple "Watch what happens!" badge only when a verb animation is queued.
- Add a tiny progress dot row (●●●○○) instead of "Word 3 of 5" text.

## Files to change

| File | Change |
|---|---|
| `src/components/aura/game/rpg/RPGOneWordReader.tsx` | Rewrite: wrap `RPGWordReader`, add Pre-K chrome, route `onResult` → verb animation, `onBatchComplete` → stars |
| `src/components/aura/game/rpg/RPGBattleBackground.tsx` | Add 3 Pre-K meadow background variants keyed by world id |
| (no other files) | Routing in `AuraPractice.tsx` already sends Pre-K to this component — no change there |

## Out of scope

- New sprite art (Wiggleworm/Bouncer/Echo from Phase 1 stay)
- Word bank changes
- HP / damage / battle stats — Pre-K stays "no fail" with infinite retries, just like now
- School Mode pivot, grades 1+ flow

Ready to implement on approval.
