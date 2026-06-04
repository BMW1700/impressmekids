# Skin Shop & Safari Fallback Fixes

Four bugs / polish items, all client-only.

## 1. Classic Knight "Equip" button does nothing

**Cause** (`src/hooks/usePlayerInventory.ts`, `equipSkin`): when `skinVariant === 'default'`, the mutation early-returns after unequipping others — no inventory row is ever written for `default_valor`. Then `getEquippedSkin('valor')` falls through to the Safari-aware fallback and returns `'realistic_default'` again, so the UI never changes.

**Fix**: Drop the `if (skinVariant === 'default') return itemId` short-circuit. Always insert/update a row with `is_equipped: true` for the equipped skin (default ones included). `getEquippedSkin` then sees the explicit row and returns `'default'`, beating the realistic fallback. No other call sites depend on the "no row for default" behavior — `ownedItems` already merges `FREE_SKIN_IDS` so default skins remain free.

## 2. Safari still shows a white box behind realistic Valor

**Cause** (`src/lib/gameEconomy.ts`, `supportsAlphaWebm`): the probe only checks `canPlayType('video/webm; codecs="vp9"') === 'probably'`. Modern Safari (16+) reports `'probably'` for VP9 but **does not support the alpha channel**, so the WebM renders opaque white.

**Fix**: tighten the probe to "Chromium/Firefox-capable AND not Safari":

```ts
export const supportsAlphaWebm = (): boolean => {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return true;
  try {
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|crios|fxios|android).)*safari/i.test(ua);
    if (isSafari) return false;                       // Safari = always SVG
    const v = document.createElement('video');
    return v.canPlayType('video/webm; codecs="vp9"') === 'probably';
  } catch { return false; }
};
```

This makes both the default-skin selection (`usePlayerInventory.getEquippedSkin`) and the `SirValorVideo` `'auto'` resolver pick the SVG branch on Safari, even if the user previously equipped `realistic_valor` on another browser. Belt-and-suspenders in `RPGCharacter.tsx`: when `artStyle === 'video'` but `!supportsAlphaWebm()`, pass `renderMode="svg"` directly (so we never even mount a `<video>` on Safari).

## 3. Default / Golden SVG Valor scaled too large

**Cause** (`src/components/aura/game/characters/SirValorVideo.tsx`): the SVG fallback maps `size=220` → `svgSize='large'` (130×220), but every other hero (Elara, PrincessElla) renders at `'medium'` (100×170). Result: Classic Knight + Golden Knight tower over the goblin.

**Fix**: in the SVG branch, hard-code `svgSize = 'medium'` so all SVG Valor variants render at the historical knight size. Wrapper box stays 220×220 (centered), baseline offset unchanged, so feet still line up with the goblin. Realistic video path is untouched.

## 4. Rename every skin to the "Sir Valor / cool realistic" scheme

`src/lib/gameEconomy.ts` only — UI auto-reflects names.

| id | Old name | New name |
|---|---|---|
| `default_valor` | Classic Knight | **Sir Valor — Classic** |
| `golden_knight` | Golden Knight | **Sir Valor — Golden Aegis** |
| `crystal_knight` | Crystal Knight | **Sir Valor — Crystal Vanguard** |
| `flame_knight` | (Flame) | **Sir Valor — Ember Blade** |
| `ice_knight` | (Ice) | **Sir Valor — Frostward** |
| `dragon_knight` | (Dragon) | **Sir Valor — Dragonbane** |
| `shadow_knight` | (Shadow) | **Sir Valor — Nightfall** |
| `realistic_valor` | Sir Valor (Realistic) | **Sir Valor — Ascendant** *(realistic tier)* |
| `default_elara` | Classic Wizard | **Elara — Classic** |
| `default_ella` | Classic Princess | **Princess Ella — Classic** |

Naming convention going forward for realistic tiers (so future Elara / Ella videos slot in): **`<Hero> — Ascendant`** for the base realistic skin, then themed cool suffixes (`Stormcaller`, `Sunforged`, etc.) for variants. Documented as a one-line comment above `STORE_ITEMS` so future skins follow the pattern.

## Files

- `src/lib/gameEconomy.ts` — rename entries, harden `supportsAlphaWebm`, add naming-convention comment.
- `src/hooks/usePlayerInventory.ts` — remove `default` short-circuit in `equipSkin`.
- `src/components/aura/game/characters/SirValorVideo.tsx` — force `svgSize='medium'` in SVG branch.
- `src/components/aura/game/rpg/RPGCharacter.tsx` — pass `renderMode="svg"` directly on Safari (defensive).

## Out of scope

- Adding new realistic skins for Elara / Ella (no video assets yet).
- Reworking the Skins grid layout or rarity colors.
- Re-encoding videos to a Safari-compatible alpha format (HEVC w/ alpha) — separate asset task.
