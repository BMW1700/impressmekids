# Animated Benny — Pro Video Treatment + Safari-Proof Alpha

## Goal
Replace the static `BennyDog` PNG crossfade with a smoothly animated video loop (like Sir Valor), and fix the Safari "white box" once and for all — for Benny AND for Valor — by shipping **two** transparent video encodings instead of relying on VP9-alpha WebM alone.

## Why Safari has been stuck
Right now we only ship `valor-*.webm` (VP9 with alpha). Safari reports it can play VP9 but **ignores the alpha channel**, so the background renders opaque white. That's why the current code falls back to SVG on Safari — there's no transparent video format Safari can actually decode.

There IS a free, universal fix: **HEVC with alpha (`hvc1` in an `.mp4`)** is natively decoded with transparency by Safari 13+ (desktop + iOS). Chrome/Firefox don't support HEVC-alpha but they already work fine with VP9-alpha WebM. Ship both → every browser gets transparency, zero white box, no SVG fallback needed.

## The uploaded clip
`Transparent_Character_Cutout.mp4` is 2880×2880, 30fps, 10s, H.264 yuv420p. It has **no real alpha channel** — the "transparent" background is solid black. We chroma-key the black out during encoding.

## Plan

### 1. Asset pipeline (one-time, run in build mode)
For Benny's uploaded clip, produce three files via ffmpeg:

```
benny-idle.webm       VP9 + alpha (yuva420p)        Chrome / Firefox / Edge
benny-idle.mp4        HEVC + alpha (hvc1, prores-like) Safari desktop + iOS
benny-idle-poster.png First frame, transparent       <video poster=…> + SSR
```

Encoding outline:
- Scale 2880→720 (Benny renders ~280px; 720 gives 2x retina headroom and keeps files small).
- Chroma-key black → alpha with `colorkey=0x000000:0.18:0.08, format=yuva420p`.
- VP9: `libvpx-vp9 -pix_fmt yuva420p -b:v 1.2M -auto-alt-ref 0`.
- HEVC-alpha: `libx265 -pix_fmt yuva420p -tag:v hvc1 -x265-params "alpha=1"` (the Nix ffmpeg in the sandbox has libx265; if alpha-aware HEVC build is missing we fall back to `prores_ks` + `qtrle` and remux into `.mov` — both also work in Safari).
- Upload all three via `lovable-assets create` → `.asset.json` pointers under `src/assets/`.

### 2. Re-encode Valor with the same pipeline
Same problem, same fix. Generate `valor-idle.mp4` / `valor-attack.mp4` / `valor-hit.mp4` as HEVC-alpha siblings to the existing `.webm` files. Add new `.asset.json` pointers next to the existing ones (we don't delete the WebMs — they're still the best choice for Chrome).

### 3. New `<TransparentVideo>` primitive
`src/components/aura/game/characters/TransparentVideo.tsx` — one tiny component used by both Benny and Valor:

```tsx
<video autoPlay loop muted playsInline poster={poster}>
  <source src={hevcMp4} type='video/mp4; codecs="hvc1"' />
  <source src={vp9Webm} type='video/webm; codecs="vp9"' />
</video>
```

The browser picks the first source it can decode. Safari grabs the HEVC-alpha mp4 (transparent), Chrome/FF grab the VP9-alpha WebM (transparent). **No JS sniffing, no white box, no SVG fallback needed.**

### 4. New `BennyVideo` component
`src/components/BennyVideo.tsx` — drop-in replacement for `BennyDog` that:
- Renders `<TransparentVideo>` for the idle loop.
- Keeps the existing `mood` prop API (`idle | celebrate | sad`).
- For Phase 1, only `idle` uses video (the uploaded clip). `celebrate` and `sad` keep the existing PNG with the bounce/shake CSS animations until we have video clips for those moods. The mood transition is a 300ms crossfade just like today.
- Same baseline offset trick as `SirValorVideo` so Benny's feet sit on the same line as before — no layout shift.

### 5. Wire Benny in
Find every importer of `BennyDog` and swap to `BennyVideo`. `BennyDog` stays in the repo as the SVG/PNG fallback (parity with `SirValor` SVG) — only invoked if the video element fails to load at all (network error), guarded by `onError` on the `<video>`.

### 6. Drop the Safari SVG fallback for Valor
Once HEVC-alpha mp4 ships, `RPGCharacter` no longer needs `supportsAlphaWebm()` to force SVG on Safari. Safari users finally see the realistic Valor with a transparent background. The SVG Valor variants stay available as **purchasable Classic skins** (the existing "Sir Valor — Classic / Golden Aegis / etc." skin set is untouched — users can still equip them).

`supportsAlphaWebm()` is kept but only used as a last-resort error handler if BOTH video sources fail to decode (corrupt asset, ancient browser).

## Files

- **New**: `src/components/aura/game/characters/TransparentVideo.tsx` (shared primitive)
- **New**: `src/components/BennyVideo.tsx`
- **New** `.asset.json` pointers in `src/assets/`:
  - `benny-idle.webm.asset.json`, `benny-idle.mp4.asset.json`, `benny-idle-poster.png.asset.json`
  - `valor-idle.mp4.asset.json`, `valor-attack.mp4.asset.json`, `valor-hit.mp4.asset.json`
- **Modified**: `src/components/aura/game/characters/SirValorVideo.tsx` — use `<TransparentVideo>` with both sources; remove Safari→SVG fallback path.
- **Modified**: `src/components/aura/game/rpg/RPGCharacter.tsx` — drop forced-SVG-on-Safari branch.
- **Modified**: every `BennyDog` importer → `BennyVideo`.
- **Untouched**: `BennyDog.tsx`, all existing Valor SVG skins, `gameEconomy.ts` skin catalog, `usePlayerInventory.ts`.

## Out of scope
- Celebrate / sad video clips for Benny (need new source footage). Phase 2.
- Re-encoding existing PNG-based skins. Phase 2 when we have realistic video for other heroes.
- Any change to skin pricing, inventory, or shop UI.

## Open questions
1. The uploaded clip background — I'll treat it as black and chroma-key to alpha. If it's actually a different color (very dark grey?) the key threshold may need a small tweak. Easy to iterate once we see the rendered loop.
2. Should the idle clip loop seamlessly? 10s @ 30fps = 301 frames. If the first and last frames don't match I'll crossfade the loop point (`-filter_complex` with a 6-frame xfade) so there's no visible cut.
