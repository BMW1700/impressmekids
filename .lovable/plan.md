## Goal

Add the next two obstacle scenes (BOOTS and KEY) to Benny Visits Grandma using the new video clips, with cinematic 1-second cross-fades between scenes. The word overlay must only appear during the freeze-frame pause, not while Benny is walking.

## Current 5 obstacles in W101_L1

1. JUMP (river) — already has A + B clips
2. BOOTS (muddy field)
3. KEY (locked gate)
4. HOP (path)
5. BONE (puppy)

## Asset mapping (to confirm by inspecting the 4 uploads)

User said "do boots and key first" with 4 uploads (9, 10, 11, 12) and confirmed two clips per obstacle (A = arrival + "I need...", B = resolution + walk-off). Tentative mapping:

- `L1-O2-A.mp4` = BOOTS setup → uploaded `9.MP4`
- `L1-O2-B.mp4` = BOOTS resolution → uploaded `10.MP4`
- `L1-O3-A.mp4` = KEY setup → uploaded `11.MP4`
- `L1-O3-B.mp4` = KEY resolution → uploaded `12.MP4`

I will inspect the first frame of each clip with ffmpeg before uploading to confirm which is mud vs. gate and which is setup vs. resolution. If the order is wrong I will reassign before publishing the asset pointers.

## Implementation steps

### 1. Upload clips as CDN assets
Use `lovable-assets create` on each `/mnt/user-uploads/{9,10,11,12}.MP4` (re-muxed if needed for audio, matching how JUMP clips were prepared) and write four new `.asset.json` pointers under `src/assets/`:
- `L1-O2-A.mp4.asset.json`
- `L1-O2-B.mp4.asset.json`
- `L1-O3-A.mp4.asset.json`
- `L1-O3-B.mp4.asset.json`

Also capture last-frame poster JPEGs for the A clips so the freeze-frame holds cleanly while the word card is up:
- `L1-O2-A-last.jpg.asset.json`
- `L1-O3-A-last.jpg.asset.json`

### 2. Extend `src/data/preKAdventuresVideo.ts`
Replace the BOOTS and KEY entries (currently word-only fallbacks) with the same clip→word→clip pattern used by JUMP:

```
{ kind: "clip", src: L1_O2_A.url, poster: L1_O2_A_LAST.url },
{ kind: "word", word: "BOOTS", askLine: "My feet need big...", successLine: "Big boots! Splish splash!" },
{ kind: "clip", src: L1_O2_B.url },
{ kind: "clip", src: L1_O3_A.url, poster: L1_O3_A_LAST.url },
{ kind: "word", word: "KEY", askLine: "To open the gate I need a...", successLine: "Click! The gate is open!" },
{ kind: "clip", src: L1_O3_B.url },
```

HOP and BONE stay as word-only steps until their videos are filmed.

### 3. Add 1-second cross-fade between clips in `NabuVideoAdventure.tsx`

Currently transitions between steps are hard cuts. Add a clip-to-clip cross-fade layer:

- Render two stacked `<video>` elements (current + next) inside an `AnimatePresence`-style wrapper.
- When a `clip` step ends (or a `word` step resolves and the next step is a `clip`), fade the outgoing layer to opacity 0 over 1000 ms while the incoming clip fades in from opacity 0 and starts playing.
- Use `framer-motion` (already in project) with `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0 }}`.
- Cross-fade only between `clip` steps. The `clip → word` transition stays as a freeze on the last frame (poster image) so no fade happens when the word card appears.
- Cross-fade also wraps the `word → clip` handoff: once the child says the word correctly, fade out the freeze-frame and fade in the resolution clip over 1 s.

### 4. Word card appearance rule (re-confirm working behavior)

The luxurious word card overlay must remain invisible while any clip is playing. It only mounts when `step.kind === "word"` AND the previous clip has fully ended (poster frame shown). This is already the case in `NabuVideoAdventure.tsx`; verify the cross-fade timing does not let the card appear while Benny is still walking off-screen. Concretely: the A clip plays to its natural end (where Benny is at the obstacle), pauses on its last frame, then the word card fades in.

### 5. Keep existing reader + AURA submission intact

No changes to `RPGWordReader` integration, `submitPreKAuraReading`, or the mic UI. This work is purely scene wiring + transitions.

## Files touched

- NEW: `src/assets/L1-O2-A.mp4.asset.json`
- NEW: `src/assets/L1-O2-B.mp4.asset.json`
- NEW: `src/assets/L1-O3-A.mp4.asset.json`
- NEW: `src/assets/L1-O3-B.mp4.asset.json`
- NEW: `src/assets/L1-O2-A-last.jpg.asset.json`
- NEW: `src/assets/L1-O3-A-last.jpg.asset.json`
- EDIT: `src/data/preKAdventuresVideo.ts` — add BOOTS and KEY clip steps
- EDIT: `src/components/aura/game/rpg/NabuVideoAdventure.tsx` — add 1 s cross-fade layer between clips

## Out of scope (next batch)

- HOP and BONE clips — will be wired in the same way once you upload them.
- Audio re-encoding/trimming beyond what's needed to make the uploaded MP4s play cleanly.
