# Pre-K Phase 1: Story Shell + Nabu the Owl

Wrap the existing 3 Pre-K worlds (101 / 102 / 103) in a story shell so every level has an opening problem, in-between dialogue, and an ending celebration — starring **Nabu the Owl** as the persistent lead, with Bobo and Echo as his friends. No new word logic, no treehouse, no collectibles, no changes to mic/speech recognition, stars, unlocking, navigation, or K–12.

---

## 1. Cast

- **Nabu the Owl** — preschool-aged, curious, slightly clumsy, kind. New persistent lead who appears in every Pre-K episode and asks the child for help.
- **Bobo** — Nabu's bouncy friend (World 102, action verbs).
- **Echo** — Nabu's shy friend (World 103, two-word phrases).
- **Nabu Village** — the sleepy world they live in (World 101, sight words).

## 2. Episode structure (every Pre-K level)

Each level becomes a 3-beat mini-episode wrapped around the existing One-Word Reader. No mechanic changes — the words, mic, stars, and progression are identical.

```text
┌───────────────────────────────┐
│ OPENING BEAT (3–5 sec)        │  Nabu speech bubble: the problem.
│   "Uh oh! Nabu can't find     │  Big illustration, one short line, one
│    his teddy. Help me!"       │  big "Help Nabu" tap-anywhere button.
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ READING (unchanged)           │  Existing RPGOneWordReader runs as-is.
│   word → mic → next word      │  Between words, a tiny Nabu bubble
│                               │  cheers ("Yes!" / "One more!").
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ CELEBRATION BEAT (3–5 sec)    │  Nabu: "We did it!" + sticker-style
│   "You found Teddy!"          │  episode title. Existing star/unlock
│                               │  screen follows untouched.
└───────────────────────────────┘
```

Same ritual every time — preschoolers love predictability.

## 3. Episode copy (15 episodes)

Hand-written opening + celebration lines, one per (world, level). Examples:

| World | Lvl | Opening (Nabu speech) | Celebration |
|-------|-----|-----------------------|-------------|
| 101 | 1 | "Nabu Village is so sleepy! Can you help me wake it up?" | "You woke up the village! Yay!" |
| 101 | 2 | "The houses are dark. Let's turn the lights on with our words!" | "Look — the lights are on!" |
| 102 | 1 | "Bobo can't remember how to JUMP. Can you remind him?" | "Bobo is bouncing again!" |
| 103 | 1 | "Echo is too shy to talk. Will you help her find her voice?" | "Echo is smiling — you did it!" |
| … | … | (15 total, hand-written) | … |

All copy lives in `nabuStoryCopy.ts`. No backend, no AI, $0/month.

## 4. Word bank: keep + grow gently

Per user direction: start with familiar words, add a few story-object words on top — no removals.

- **World 101 (sight words)** — unchanged.
- **World 102 (action verbs)** — unchanged.
- **World 103 (two-word phrases)** — keep current phrases; add 3–4 new preschool-friendly object phrases (e.g. `"my teddy"`, `"hot cookie"`, `"big dog"`) only on levels that have room. Conservative: no level loses a word it already has.

Mic, scoring, stars, unlock thresholds — untouched.

## 5. TTS settings toggle

Add a **"Read text aloud (text-to-speech)"** on/off toggle in the existing `SettingsMenu.tsx`, sitting next to language and theme controls.

- Default: **on**.
- Stored in `localStorage` under `nabu.tts.enabled`.
- Pre-K speech bubbles read aloud via the browser Web Speech API only when toggle is on.
- When off, bubbles render text-only and stay fully usable.
- Toggle has no effect on mic/speech recognition or on K–12 modes.

## 6. Scope guardrails

**In scope:**
- New `NabuEpisodeIntro` and `NabuEpisodeOutro` components.
- A tiny inline `NabuBubble` between words (text + optional TTS).
- `nabuStoryCopy.ts` extended with `getEpisodeOpening(worldId, levelId)` and `getEpisodeCelebration(worldId, levelId)`.
- `RPGOneWordReader.tsx` wraps its render in `intro → reader → outro` only when `world.mode === 'prek'`.
- `SettingsMenu.tsx` gains the TTS toggle.
- A `useTtsSetting()` hook + `speak()` utility that no-ops when the toggle is off.

**Out of scope (Phase 2+):**
- Sticker book, treehouse, collectibles, decoration.
- Character friends beyond Bobo/Echo.
- Replacing or removing existing verbs/animations.
- New characters in K–12, Agent, or Castle Swarm modes.
- Recorded voice acting (architecture leaves room; not built now).

**Untouched (confirmed):**
- K–12 (Classic Adventure, Agent, Castle Swarm, all worlds with `mode !== 'prek'`).
- Mic / speech recognition / matching rules.
- Hear button, stars, unlocking, navigation, dashboards.
- Database, RLS, grade-mode logic, analytics.
- Pre-K mode card on the dashboard (already shipped).

## 7. Files to change

```text
src/lib/nabuStoryCopy.ts                                 +episode copy + getters
src/components/aura/game/rpg/RPGOneWordReader.tsx        wrap with intro/outro for prek
src/components/aura/game/rpg/NabuEpisodeIntro.tsx        NEW
src/components/aura/game/rpg/NabuEpisodeOutro.tsx        NEW
src/components/aura/game/rpg/NabuBubble.tsx              NEW (between-word cheers)
src/components/aura/game/rpg/NabuOwl.tsx                 NEW (SVG/illustrated owl mascot)
src/lib/tts.ts                                           NEW: speak() + useTtsSetting()
src/components/SettingsMenu.tsx                          +TTS toggle row
src/data/preKWordBanks.ts                                small additive World 103 phrases
```

## 8. Success criteria

- Every Pre-K level opens with a Nabu speech bubble stating the problem and ends with a celebration line.
- Nabu appears as a visible mascot in all three worlds (lead in 101, alongside Bobo in 102, alongside Echo in 103).
- A child can complete a level without reading any UI text — the loop is visual + (optional) TTS.
- Turning the TTS toggle off silences all Nabu speech but keeps the game fully playable.
- K–12 modes look and behave identically to today.
- No regressions in mic, stars, unlock thresholds, or navigation.

## 9. Phase 2 preview (not built now)

Once Phase 1 lands and Patrick can feel the emotional shape, Phase 2 adds: sticker book on the Pre-K world map, episode-to-episode story arc ("Nabu's First Big Day"), and a treehouse home base. Architecture in Phase 1 leaves clean room for all three.
