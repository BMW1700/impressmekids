## Goal

Rebuild the W101_L1 "Help Benny visit Grandma!" level so it plays as a real mini-story:

```
INTRO clip → JUMP (existing) → BOOTS (existing) → KEY (existing)
            → PUSH (new)     → SNEAK (new)      → GRANDMA ending clip → win screen
```

The two placeholder word-only steps (HOP, BONE) that currently sit at the end with no video get removed.

## Video → step mapping

Based on the user's ordering:

| # | Uploaded file | Role |
|---|---|---|
| 1 | `My Movie 37 2.MOV` | INTRO clip (non-interactive, plays first) |
| 2 | `Initial_Scene_-_2026-06-10_202606101735.MOV` | PUSH clip A — Benny asks "How do I move this?" (freezes on last frame) |
| 3 | `Initial_Scene_-_2026-06-10_202606101735 2.MOV` | PUSH clip B — Benny pushes the log |
| 4 | `Initial_Scene_-_2026-06-11_202606102216.MOV` | SNEAK clip A — approaches sleeping bear |
| 5 | `Initial_Scene_-_2026-06-11_202606102216 2.MOV` | SNEAK clip B — Benny sneaks past the bear |
| 6 | `Untitled_Scene_06-10_22_46_21_202606101850.MOV` | GRANDMA ending (non-interactive, fades into level-complete) |

## Implementation

### 1. Upload videos as CDN assets
Run `lovable-assets create` on each of the 6 MOVs from `/mnt/user-uploads/`, writing pointer JSON to `src/assets/`:
- `src/assets/L1-intro.mp4.asset.json`
- `src/assets/L1-O4-A.mp4.asset.json` (PUSH ask)
- `src/assets/L1-O4-B.mp4.asset.json` (PUSH action)
- `src/assets/L1-O5-A.mp4.asset.json` (SNEAK ask)
- `src/assets/L1-O5-B.mp4.asset.json` (SNEAK action)
- `src/assets/L1-ending-grandma.mp4.asset.json`

(Container is `.MOV` / QuickTime but browsers play H.264 inside fine; if any clip fails to play on Chromium during smoke test, we'll transcode to MP4 in a follow-up — won't block this plan.)

### 2. Generate "last frame" poster images for the two new ask clips
The video runner freezes on the previous clip's last frame while the word card is up. Use `ffmpeg` to extract the last frame of PUSH-A and SNEAK-A and upload as assets:
- `src/assets/L1-O4-A-last.jpg.asset.json`
- `src/assets/L1-O5-A-last.jpg.asset.json`

(Intro and ending are pure clips with no freeze-frame, so no posters needed.)

### 3. Rewrite `src/data/preKAdventuresVideo.ts`

Replace the `W101_L1.steps` array so the order is:

```
clip: intro
clip: O1-A (poster O1-A-last)
word: JUMP — "I need to..." / "Whoosh! Over we go!"
clip: O1-B
clip: O2-A (poster O2-A-last)
word: BOOTS — "My feet need big..." / "Big boots! Splish splash!"
clip: O2-B
clip: O3-A (poster O3-A-last)
word: KEY — "To open the gate I need a..." / "Click! The gate is open!"
clip: O3-B
clip: O4-A (poster O4-A-last)
word: PUSH — "How do I move this..." / "Heave! The log rolls away!"
clip: O4-B
clip: O5-A (poster O5-A-last)
word: SNEAK — "The bear is sleeping. I need to..." / "Tiptoe... safe!"
clip: O5-B
clip: ending-grandma
```

Remove the trailing `HOP` and `BONE` placeholder word steps.

Keep `id: "w101-l1"`, `goal: "Help Benny visit Grandma!"`, `endingLine: "We made it to Grandma's!"`.

### 4. Verify `NabuVideoAdventure` already handles leading/trailing clip-only steps

Quick read of `src/components/aura/game/rpg/NabuVideoAdventure.tsx` to confirm:
- It walks `steps` sequentially regardless of kind (it does — that's the whole point of the flat step list).
- The completion call (`onComplete`) fires after the final step, which will now be the grandma clip → naturally fades into the existing `PassageCompleteCelebration` award screen that the wrapper already shows.

If the runner currently requires the *last* step to be a `word`, we adjust it so a trailing `clip` step completes the level when it finishes playing. (Will confirm during build.)

### 5. Smoke test
- Boot preview, sign in as a Pre-K student, enter World 101 Level 1.
- Verify: intro plays → fades to O1-A → JUMP card → O1-B → … → PUSH/SNEAK both work like JUMP → grandma clip plays → award popup → level 2 unlocked.

## Out of scope

- No changes to other worlds, K-12 RPG flow, scoring, or AURA telemetry.
- No transcoding pipeline — using uploads as-is.
- No new copy beyond the two new ask/success lines (PUSH, SNEAK) shown above; happy to tweak wording before build if you want different lines.

## Question before I build

The PUSH and SNEAK narration lines above ("How do I move this...", "The bear is sleeping. I need to...") are my best guess from your description. Want me to use those verbatim, or do you have exact lines you want narrated?
