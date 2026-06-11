## Change

In `src/components/aura/game/rpg/NabuVideoAdventure.tsx`, bump the `motion.video` cross-fade from `duration: 1.0` to `duration: 2.0` (line ~385).

That's the only timing knob that controls clip-to-clip transitions. The word-card moment (freeze-frame + ask + mic listen) does not swap `src`, so AnimatePresence doesn't fire and that beat is untouched — only the visual fade between different video clips lengthens.

No other files affected.
