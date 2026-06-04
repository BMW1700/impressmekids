
# Finalize Valor visuals + skin-level art tier (SVG ⇄ Video)

## 1. Hero / enemy feet alignment

Root cause: `items-end` aligns the wrapper boxes, but the character pixels inside Sir Valor's 220×220 video don't reach the bottom edge, so he floats above the goblin's feet.

Fix in `SirValorVideo.tsx`:
- Apply a calibrated negative `marginBottom` (~`-28px`, scaled to `size`) on the outer wrapper, exposed as `VALOR_BASELINE_OFFSET`.
- Keep `objectPosition: 50% 100%` so trim comes from the empty area above the head, not from the character.
- No layout changes in `RPGBattleArena.tsx`.

## 2. Safari white box → automatic SVG fallback

Two parts:

**(a) Capability probe** (run once in `SirValorVideo.tsx`):
```ts
const supportsAlphaWebm =
  typeof document !== "undefined" &&
  document.createElement("video").canPlayType('video/webm; codecs="vp9"') === "probably";
```
Empty / `"maybe"` = unsupported (covers Safari).

**(b) Render mode**: a `renderMode: 'video' | 'svg' | 'auto'` prop on `SirValorVideo`. Resolution:
- `'auto'` + unsupported → `'svg'`
- `'auto'` + supported → `'video'`
- Explicit values are honored.

When the resolved mode is `'svg'`, `SirValorVideo` delegates to the existing `SirValor` SVG component (which already supports all `ValorSkinVariant`s) and still wraps the HP bar, name chip, and sword shine. Eliminates the Safari white box automatically.

## 3. Two distinct skin "art tiers" in the existing shop

This is the part the user explicitly called out: equipping "Classic Knight" in the shop must actually show the SVG knight, not the video Valor.

**Today** in `src/lib/gameEconomy.ts`:
- `default_valor` → `skinVariant: 'default'` → routes to `SirValorVideo` regardless (bug).
- All Valor skins (`golden`, `crystal`, `flame`, `ice`, `dragon`, `shadow`) only exist as SVG palettes but currently get hijacked by the video component.

**Fix**: treat the art style as part of the skin identity. Two parallel skin lines:

```text
Classic (SVG, free starter)        Realistic (Video, new flushed-out art)
─────────────────────────────────  ───────────────────────────────────────
default_valor      Classic Knight  realistic_valor   Sir Valor (Realistic)
golden_knight      Golden Knight   (future: realistic_golden_valor, etc.)
crystal_knight     Crystal Knight
flame_knight       Flame Knight
ice_knight         Frost Guardian
dragon_knight      Dragon Knight
shadow_knight      Shadow Knight
```

Concretely:

**3a. Add an `artStyle` field to shop items** (`src/lib/gameEconomy.ts`):
```ts
artStyle?: 'svg' | 'video';   // defaults to 'svg' when omitted
```
- Tag all existing Valor skins (`default_valor`, `golden_knight`, …) with `artStyle: 'svg'`.
- Add a new starter entry **`realistic_valor`** — `price: 0`, `rarity: 'rare'`, `character: 'valor'`, `skinVariant: 'realistic_default'`, `artStyle: 'video'`, `name: 'Sir Valor (Realistic)'`, `description: 'The new flushed-out Sir Valor.'` Unlocked by default so kids can flip to it immediately.
- Leaves room to add `realistic_golden_valor`, `realistic_flame_valor`, etc., later as new realistic skins are produced — no schema change required.

**3b. Route by art style in `RPGCharacter.tsx`** (knight branch):
- Read the equipped Valor skin's `artStyle` from the catalog (lookup helper in `gameEconomy.ts`, e.g. `getSkinById(skinVariant) → ShopItem`).
- If `artStyle === 'video'` → render `SirValorVideo` with the chosen variant (currently only `realistic_default`).
- If `artStyle === 'svg'` → render the existing `SirValor` SVG component with the matching `ValorSkinVariant` (`default | golden | crystal | flame | ice | dragon | shadow`) and skip `SirValorVideo` entirely.
- Safari forces `artStyle: 'svg'` regardless of the equipped skin (with a small one-time toast: *"Realistic Valor is only available on Chrome/Edge/Firefox — using Classic art."*), so Safari users effectively start as the Classic SVG hero. They can still browse/equip the realistic skin; we just render the SVG until they switch browsers.

**3c. Store UI** (`RPGStore.tsx` / `SkinPreviewCard.tsx`):
- Group skins under two collapsible sub-headers inside the Skins tab: **Classic** (SVG) and **Realistic** (Video / new flushed-out art).
- Each tile shows a small badge (`Classic` / `Realistic`) so kids can tell the lines apart.
- Equipping a skin persists its full id (e.g. `realistic_default` or `golden`) into the existing `equippedSkins.valor` slot — no DB migration; values are already free-form strings.

**3d. Forward-compatible**: when realistic Elara / Princess Ella videos arrive later, the same pattern applies — add `realistic_elara`, `realistic_ella` entries with `artStyle: 'video'`, route in their character branches, and the SVG fallback story carries over for free.

## 4. Sword glow (already approved)

Keep the previously approved CSS shine + radial halo, applied inside both render branches so the Classic SVG knight also sparkles. Respects `prefers-reduced-motion`.

## 5. Files changed

- `src/components/aura/game/characters/SirValorVideo.tsx`
  - Baseline offset, capability probe, `renderMode` prop, SVG delegation.
- `src/components/aura/game/rpg/RPGCharacter.tsx`
  - Knight branch reads `artStyle` from the equipped skin and routes to `SirValor` (SVG) or `SirValorVideo`.
- `src/lib/gameEconomy.ts`
  - Add `artStyle` to `ShopItem`, tag existing Valor skins as `'svg'`, add new `realistic_valor` entry, add `getSkinById` helper.
- `src/components/aura/game/rpg/RPGStore.tsx` (+ `SkinPreviewCard.tsx` if needed)
  - Group skins by `artStyle`, render badge, preview the correct art per tile.
- (Optional, tiny) `src/hooks/usePlayerInventory.ts` — auto-grant `realistic_valor` on first load so it appears as an equip-ready starter alongside `default_valor`.

## Out of scope

- New realistic skins for Elara / Princess Ella (videos don't exist yet; structure is ready).
- Additional realistic Valor variants beyond the base — added as videos land.
- Re-encoding existing webm/mp4 assets.
- Backend/DB schema changes (everything is client-side catalog + string ids).
