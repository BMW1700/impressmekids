/**
 * RPG v2 — Loot & Gear catalog.
 * Item IDs are generated server-side by `roll_boss_loot` as
 * `w{world}-{slot}-{rarity}-{1..3}`. This catalog resolves those IDs
 * into displayable names, flavor lines, emoji, and world-themed sets.
 *
 * Purely cosmetic/lookup — real stats live on the row `stats` JSONB.
 */

export type LootSlot = "weapon" | "armor" | "trinket";
export type LootRarity = "common" | "uncommon" | "rare" | "legendary";

export interface LootStats {
  hp?: number;
  attack?: number;
  mp_regen?: number;
}

export interface LootItem {
  id: string;
  item_id: string;
  name: string;
  rarity: LootRarity;
  slot: LootSlot;
  stats: LootStats;
  world_number?: number | null;
  equipped?: boolean;
  emoji: string;
  flavor: string;
}

const WORLD_THEMES: Record<number, { name: string; emoji: string; palette: string }> = {
  1: { name: "Emberwood",  emoji: "🔥", palette: "orange" },
  2: { name: "Frostpeak",  emoji: "❄️", palette: "cyan" },
  3: { name: "Cyberline",  emoji: "🤖", palette: "violet" },
  4: { name: "Deep Reef",  emoji: "🌊", palette: "blue" },
  5: { name: "Skyforge",   emoji: "⚡", palette: "yellow" },
  6: { name: "Bonehold",   emoji: "💀", palette: "slate" },
  7: { name: "Sunspire",   emoji: "☀️", palette: "amber" },
  8: { name: "Voidkeep",   emoji: "🌌", palette: "purple" },
};

const SLOT_NAMES: Record<LootSlot, string[]> = {
  weapon:  ["Blade",  "Hammer", "Fang"],
  armor:   ["Plate",  "Cloak",  "Aegis"],
  trinket: ["Charm",  "Sigil",  "Rune"],
};

const RARITY_LABELS: Record<LootRarity, string> = {
  common:    "Common",
  uncommon:  "Uncommon",
  rare:      "Rare",
  legendary: "Legendary",
};

const RARITY_COLORS: Record<LootRarity, { text: string; ring: string; glow: string; bg: string; border: string }> = {
  common: {
    text: "text-slate-200",
    ring: "ring-slate-400/40",
    glow: "shadow-slate-500/20",
    bg: "bg-slate-800/70",
    border: "border-slate-500/40",
  },
  uncommon: {
    text: "text-emerald-300",
    ring: "ring-emerald-400/50",
    glow: "shadow-emerald-500/30",
    bg: "bg-emerald-950/60",
    border: "border-emerald-500/50",
  },
  rare: {
    text: "text-sky-300",
    ring: "ring-sky-400/60",
    glow: "shadow-sky-500/40",
    bg: "bg-sky-950/60",
    border: "border-sky-400/60",
  },
  legendary: {
    text: "text-amber-300",
    ring: "ring-amber-400/70",
    glow: "shadow-amber-500/60",
    bg: "bg-gradient-to-br from-amber-950/80 to-orange-950/80",
    border: "border-amber-400/70",
  },
};

const SLOT_EMOJI: Record<LootSlot, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  trinket: "💠",
};

/** Parse a server-generated item_id into pieces. */
function parseItemId(id: string): { world: number; slot: LootSlot; rarity: LootRarity; variant: number } | null {
  const m = /^w(\d+)-(weapon|armor|trinket)-(common|uncommon|rare|legendary)-([123])$/.exec(id);
  if (!m) return null;
  return {
    world: parseInt(m[1], 10),
    slot: m[2] as LootSlot,
    rarity: m[3] as LootRarity,
    variant: parseInt(m[4], 10),
  };
}

/** Human-friendly name for any dropped item_id. */
export function resolveLootName(id: string): string {
  const p = parseItemId(id);
  if (!p) return "Mystery Relic";
  const theme = WORLD_THEMES[p.world] ?? { name: "Wild", emoji: "✨", palette: "slate" };
  const slotName = SLOT_NAMES[p.slot][p.variant - 1] ?? SLOT_NAMES[p.slot][0];
  return `${theme.name} ${slotName}`;
}

export function resolveLootFlavor(id: string): string {
  const p = parseItemId(id);
  if (!p) return "An unknown treasure from the depths.";
  const theme = WORLD_THEMES[p.world]?.name ?? "the frontier";
  const slotFlavor: Record<LootSlot, string> = {
    weapon: `Forged in ${theme}. Strikes with the world's own fire.`,
    armor: `Woven from ${theme}'s hardest scales. Turns aside the darkness.`,
    trinket: `A relic of ${theme}. Bends fate a little in your favor.`,
  };
  return slotFlavor[p.slot];
}

export function resolveLootEmoji(id: string): string {
  const p = parseItemId(id);
  if (!p) return "🎁";
  return `${WORLD_THEMES[p.world]?.emoji ?? "✨"}${SLOT_EMOJI[p.slot]}`;
}

export function rarityLabel(r: LootRarity): string {
  return RARITY_LABELS[r];
}

export function rarityColors(r: LootRarity) {
  return RARITY_COLORS[r];
}

export function slotEmoji(s: LootSlot): string {
  return SLOT_EMOJI[s];
}

export function slotLabel(s: LootSlot): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Sum stats from a set of equipped items. */
export function sumEquippedStats(items: Pick<LootItem, "stats" | "equipped">[]): Required<LootStats> {
  const total: Required<LootStats> = { hp: 0, attack: 0, mp_regen: 0 };
  for (const it of items) {
    if (!it.equipped) continue;
    total.hp += it.stats.hp ?? 0;
    total.attack += it.stats.attack ?? 0;
    total.mp_regen += it.stats.mp_regen ?? 0;
  }
  return total;
}
