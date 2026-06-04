# Fix Valor's white box — zero cost, zero slowdown

## Cost & performance — confirmed
- **Cost: $0.** Files go to the same Lovable Assets CDN already in use. No new service, no metered storage.
- **Speed: imperceptible.** Re-encoded sizes: idle 884 KB, attack 1.1 MB, hit 571 KB. They're served once from CDN, then browser-cached forever. The old MP4s were 220–435 KB; the increase is ~1 MB total on first load of the combat screen — a single small image's worth. No runtime cost (still hardware-decoded video, no JS overhead, no blend-mode hack).

## What I'll do the moment you flip to build mode
1. **Upload** the 3 already-encoded transparent WebMs + 1 transparent PNG poster (sitting in `/tmp/valor/`) via `lovable-assets`. Writes 4 new `.asset.json` files.
2. **Edit `SirValorVideo.tsx`** (only file changed):
   - Point variants at the new WebM URLs + transparent poster.
   - `<video>` gets both `<source type="video/webm">` and the existing MP4 as a graceful fallback.
   - Remove `mixBlendMode: "multiply"` from both video and reduced-motion paths.
3. **Delete** the now-unused poster pointer (`valor-idle-poster.png.asset.json`) — the old MP4 pointers stay as the fallback `<source>`.

Nothing else changes: component API, call sites (`BattleArena.tsx`, `RPGCharacter.tsx`), position, size, timing, animations, Princess Ella, goblin, mechanics — all untouched.

## Result
White rectangle gone. Valor renders with true alpha on the forest background, exactly like the still PNG you uploaded.

Switch to build mode and I'll execute — encoding is already done.