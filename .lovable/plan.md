## Goals

1. Position hero and enemy evenly on the battle stage.
2. Show Sir Valor's HP bar directly under him (same style as the goblin).
3. Make Sir Valor's sword glint/glow on an occasional loop (no re-encoding video).
4. Ship a skin system that does NOT require re-shooting the 3 videos per skin.

All UI/presentation only. Zero new $ cost. Zero added network weight (overlays are tiny SVG/CSS).

---

## 1. Even hero/villain positioning + HP bar under Valor

In `RPGBattleArena.tsx` the enemy side renders a single character via `flex-1`, and the hero side renders Valor + Elara inside another `flex-1` with `gap-4`. Valor is sized 220 while the goblin sprite is "medium" — that's why the screenshot looks lopsided and Valor floats higher with no HP bar.

Changes:
- Wrap each side in a fixed-width column (e.g. `w-[320px]`) and vertically align with `items-end` so feet land on the same baseline.
- Pass `showHealthBar={true}` through to `SirValorVideo` so it renders an HP bar (currently it ignores the prop).
- Add an HP bar inside `SirValorVideo` — same visual treatment as the goblin: name label above, thin bar with `currentHp/maxHp` text below, anchored to the bottom of the 220px box. Reuse the existing `<HealthBar>` primitive used by Elara/Goblin so styling stays consistent.

No changes to combat logic, no new props beyond `currentHp`, `maxHp`, `showHealthBar`, `name` on `SirValorVideo`.

---

## 2. Sword glow (occasional shimmer)

A pinned overlay on top of the Valor video, anchored at the sword tip in the idle frame. Two layers:

- A soft radial-gradient "halo" div positioned absolutely at roughly `top: 32%, left: 70%` of the 220px box (we'll eyeball it against the idle poster).
- A diagonal `linear-gradient` "shine" sliver that sweeps across the sword every ~6–9 seconds via a keyframe (`translateX(-120%) → translateX(120%)`) with `mix-blend-mode: screen`.

Both pure CSS, GPU-cheap, respects `prefers-reduced-motion` (skip the sweep, keep the static halo dim). No video changes.

---

## 3. Skin system without re-shooting videos

Strategy: treat the base video as a fixed "puppet" and layer tint + accessory PNG overlays on top, anchored to known points in the idle frame. A skin = a JSON descriptor, not a new video.

A skin descriptor looks like:

```ts
type ValorSkin = {
  id: string;                       // 'crimson', 'royal', 'shadow'
  label: string;
  // Color: applied as a CSS filter on the video element.
  filter?: string;                  // 'hue-rotate(160deg) saturate(1.2)'
  // Optional tinted overlay clipped to silhouette via mix-blend-mode.
  tint?: { color: string; opacity: number; blend: 'color' | 'multiply' | 'overlay' };
  // Anchored PNG accessories (plume, cape, sword aura, crown, etc).
  // Each is a tiny transparent PNG uploaded once via lovable-assets.
  accessories?: Array<{
    asset: string;                  // url from .asset.json
    anchor: { xPct: number; yPct: number };
    widthPct: number;
    z?: 'under' | 'over';           // render under or over the video layer
    sway?: boolean;                 // gentle CSS bob for capes/plumes
  }>;
};
```

Why this works:
- Hue-rotate / saturate / brightness on a single `<video>` element recolors armor + plume globally — gives 5–10 free palette variants from one source video.
- Tint overlay with `mix-blend-mode: color` over the silhouette pushes recoloring further (e.g. crimson knight, obsidian knight).
- PNG accessories handle the "shape-changing" cases the user worried about: bigger plume, golden crown, glowing sword aura, demon horns. Each accessory is a one-time static PNG, sized ~256px, ~10–30 KB — generated once with imagegen.

Registration: extend the existing `VALOR_VARIANTS` map. `default` keeps the current behavior with no filter/accessories. New skins just add an entry.

Rendering: inside `SirValorVideo`, wrap the existing video stack with two new positioned layers (`accessories.under`, the videos+tint, `accessories.over`) and apply `style={{ filter: skin.filter }}` to the video element. Reduced-motion users still get the same poster with the same filter applied.

This means: 1 set of 3 videos → unlimited skins, each defined by a few lines of JSON + a couple of tiny PNGs.

---

## Technical Details

Files touched:
- `src/components/aura/game/characters/SirValorVideo.tsx` — accept `currentHp`, `maxHp`, `showHealthBar`, `name`; render HP bar below the video; add sword-glow overlay; add skin descriptor pipeline (filter + tint + accessories).
- `src/components/aura/game/rpg/RPGCharacter.tsx` — pass `currentHp`, `maxHp`, `showHealthBar`, `name`, and `skinVariant` through to `SirValorVideo`.
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — equalize the two character columns (`w-[320px] flex justify-center items-end`) and ensure the HP-bar prop is set for Valor (already true: `showHealthBar={true}`).
- No backend, no edge function, no DB.

The sword-glow keyframe goes in `tailwind.config.ts` as `valor-sword-shine` so it's reusable.

---

## Out of scope (will revisit later)

- Generating the first batch of accessory PNGs (crown, capes, etc.) — we'll add them when you ask for specific skins.
- Generalizing this skin pipeline to Elara/Agent X — same approach will port, but only Valor for now.
