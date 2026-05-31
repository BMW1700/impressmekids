import type { EnemyType } from "./enemyTypes";
import type { GradeMode } from "@/lib/gameTheme";

export interface CampaignLevel {
  id: string;
  name: string;
  description: string;
  waveCount: number;
  composition: EnemyType[];     // pool repeated per wave with HP scaled by index
  baseSpeedPxPerSec: number;
  enemyCastleHp: number;
  starThresholds: { needAccuracy: number; needWords: number };
  arc?: CastleArcId;            // which story arc this level belongs to
}

/** 5 castle-specific story arcs — 5 levels each, runs alongside legacy 10 levels. */
export type CastleArcId =
  | "goblin_kings_return"
  | "frost_invasion"
  | "sky_pirates"
  | "necromancers_tower"
  | "the_final_siege";

export interface CastleArc {
  id: CastleArcId;
  title: string;
  subtitle: string;
  intro: string;          // shown in interstitial before level 1 of the arc
  outro: string;          // shown after the final level
  bannerHue: string;      // tailwind hue (e.g. "amber", "cyan")
}

export const CASTLE_ARCS: Record<CastleArcId, CastleArc> = {
  goblin_kings_return: {
    id: "goblin_kings_return",
    title: "The Goblin King's Return",
    subtitle: "He swore he'd be back. He kept his word.",
    intro: "Smoke rises from the eastern hills. The Goblin King has rallied a new horde — and they are marching on your keep. Read true, captain. The walls are only as strong as your voice.",
    outro: "The Goblin King falls. The horde scatters into the woods. For now, the keep is safe — but other shadows are stirring.",
    bannerHue: "amber",
  },
  frost_invasion: {
    id: "frost_invasion",
    title: "Frost Invasion",
    subtitle: "Winter brought an army with it.",
    intro: "The river froze in a single night. Armored figures cross it on foot. Your archers' arrows skitter off ice-plated shields — but words still cut deep.",
    outro: "The Frost King's crown shatters. Spring returns to the valley. Your knights warm their hands by the fire and tell the story for years.",
    bannerHue: "cyan",
  },
  sky_pirates: {
    id: "sky_pirates",
    title: "Sky Pirates",
    subtitle: "They came on wings, not wheels.",
    intro: "Sails of black silk darken the sun. The pirates' wyverns dive low — they want the granaries. Read fast, captain, before the sky empties our stores.",
    outro: "The last wyvern crashes into the moat. The captured pirate captain bows and offers a parley. You decline. Your castle does not negotiate with thieves.",
    bannerHue: "violet",
  },
  necromancers_tower: {
    id: "necromancers_tower",
    title: "The Necromancer's Tower",
    subtitle: "The dead do not stay dead here.",
    intro: "A black spire grew overnight in the marshes. Every skeleton you fell, the Necromancer raises again. We must reach the tower — every word you read brings us closer.",
    outro: "The tower crumbles. The marsh is silent for the first time in a decade. Even the crows go elsewhere.",
    bannerHue: "emerald",
  },
  the_final_siege: {
    id: "the_final_siege",
    title: "The Final Siege",
    subtitle: "All of them. At once. At your gate.",
    intro: "Goblins. Frost knights. Sky pirates. Risen dead. They have made an alliance against the keep. This is the last stand, captain. Read like the world depends on it — because today it does.",
    outro: "Dawn breaks over the ruined siege camp. Your knights raise their banners. The kingdom is yours. The bards are already writing songs.",
    bannerHue: "rose",
  },
};

const k5Levels: CampaignLevel[] = [
  // ===== Legacy arc (kept) =====
  { id: "k5-1", name: "Goblin Patrol", description: "First few goblins test your reading.", waveCount: 3, composition: ["goblin"], baseSpeedPxPerSec: 35, enemyCastleHp: 30, starThresholds: { needAccuracy: 70, needWords: 10 } },
  { id: "k5-2", name: "Bone Yard", description: "Skeletons ignore frost magic.", waveCount: 4, composition: ["goblin", "skeleton"], baseSpeedPxPerSec: 40, enemyCastleHp: 45, starThresholds: { needAccuracy: 75, needWords: 18 } },
  { id: "k5-3", name: "Night Flight", description: "Bats slip past your knights — read fast!", waveCount: 5, composition: ["goblin", "bat", "skeleton"], baseSpeedPxPerSec: 45, enemyCastleHp: 60, starThresholds: { needAccuracy: 75, needWords: 25 } },
  { id: "k5-4", name: "Witch Doctor", description: "Shamans heal their friends.", waveCount: 5, composition: ["goblin", "skeleton", "shaman"], baseSpeedPxPerSec: 45, enemyCastleHp: 75, starThresholds: { needAccuracy: 80, needWords: 30 } },
  { id: "k5-5", name: "Brute Force", description: "An Orc Brute leads the charge.", waveCount: 6, composition: ["goblin", "skeleton", "orc"], baseSpeedPxPerSec: 50, enemyCastleHp: 90, starThresholds: { needAccuracy: 80, needWords: 38 } },
  { id: "k5-6", name: "Twin Towers", description: "Mixed swarms with double bats.", waveCount: 7, composition: ["goblin", "bat", "bat", "skeleton", "shaman"], baseSpeedPxPerSec: 55, enemyCastleHp: 110, starThresholds: { needAccuracy: 80, needWords: 45 } },
  { id: "k5-7", name: "Shaman Coven", description: "Healers everywhere — focus them down.", waveCount: 7, composition: ["goblin", "shaman", "shaman", "skeleton"], baseSpeedPxPerSec: 55, enemyCastleHp: 130, starThresholds: { needAccuracy: 82, needWords: 55 } },
  { id: "k5-8", name: "Iron Legion", description: "Multiple orcs. You'll need supers.", waveCount: 8, composition: ["goblin", "orc", "skeleton", "orc"], baseSpeedPxPerSec: 60, enemyCastleHp: 160, starThresholds: { needAccuracy: 85, needWords: 65 } },
  { id: "k5-9", name: "Sky Assault", description: "Flying horde — only powers and reading hit them.", waveCount: 8, composition: ["bat", "bat", "bat", "goblin", "shaman"], baseSpeedPxPerSec: 65, enemyCastleHp: 180, starThresholds: { needAccuracy: 85, needWords: 75 } },
  { id: "k5-10", name: "Goblin King", description: "The final assault on his keep.", waveCount: 10, composition: ["goblin", "skeleton", "shaman", "bat", "orc"], baseSpeedPxPerSec: 70, enemyCastleHp: 240, starThresholds: { needAccuracy: 85, needWords: 90 } },

  // ===== Arc: The Goblin King's Return =====
  { id: "k5-arc1-1", name: "Burning Watchtower", description: "A goblin raiding party tests the eastern wall.", arc: "goblin_kings_return", waveCount: 5, composition: ["goblin", "goblin", "skeleton"], baseSpeedPxPerSec: 50, enemyCastleHp: 90, starThresholds: { needAccuracy: 78, needWords: 30 } },
  { id: "k5-arc1-2", name: "Forest Ambush", description: "Berserkers charge from the treeline.", arc: "goblin_kings_return", waveCount: 6, composition: ["goblin", "berserker", "shaman"], baseSpeedPxPerSec: 55, enemyCastleHp: 130, starThresholds: { needAccuracy: 80, needWords: 40 } },
  { id: "k5-arc1-3", name: "The Iron Pass", description: "Armored orcs lock shields and march.", arc: "goblin_kings_return", waveCount: 7, composition: ["orc", "armored_orc", "shaman", "goblin"], baseSpeedPxPerSec: 55, enemyCastleHp: 180, starThresholds: { needAccuracy: 82, needWords: 55 } },
  { id: "k5-arc1-4", name: "Wyverns Overhead", description: "The King unleashes his sky cavalry.", arc: "goblin_kings_return", waveCount: 8, composition: ["bat", "wyvern", "goblin", "shaman"], baseSpeedPxPerSec: 65, enemyCastleHp: 210, starThresholds: { needAccuracy: 85, needWords: 70 } },
  { id: "k5-arc1-5", name: "The Goblin King's Last Stand", description: "His personal guard. His final charge.", arc: "goblin_kings_return", waveCount: 10, composition: ["goblin", "armored_orc", "berserker", "wyvern", "shaman"], baseSpeedPxPerSec: 70, enemyCastleHp: 300, starThresholds: { needAccuracy: 87, needWords: 100 } },

  // ===== Arc: Frost Invasion =====
  { id: "k5-arc2-1", name: "The Frozen River", description: "Skeletons cross the ice toward the gate.", arc: "frost_invasion", waveCount: 6, composition: ["skeleton", "skeleton", "armored_orc"], baseSpeedPxPerSec: 55, enemyCastleHp: 150, starThresholds: { needAccuracy: 82, needWords: 50 } },
  { id: "k5-arc2-2", name: "Glacier Hunters", description: "Wyverns nest in the cliffs above.", arc: "frost_invasion", waveCount: 7, composition: ["wyvern", "wyvern", "skeleton", "shaman"], baseSpeedPxPerSec: 65, enemyCastleHp: 180, starThresholds: { needAccuracy: 84, needWords: 65 } },
  { id: "k5-arc2-3", name: "The Frost King's Vanguard", description: "Berserkers in iron-shod boots.", arc: "frost_invasion", waveCount: 8, composition: ["berserker", "armored_orc", "skeleton", "shaman"], baseSpeedPxPerSec: 60, enemyCastleHp: 230, starThresholds: { needAccuracy: 86, needWords: 80 } },
  { id: "k5-arc2-4", name: "The Crown Fortress", description: "Five waves to break the line.", arc: "frost_invasion", waveCount: 10, composition: ["berserker", "armored_orc", "wyvern", "necromancer", "skeleton"], baseSpeedPxPerSec: 70, enemyCastleHp: 320, starThresholds: { needAccuracy: 88, needWords: 110 } },

  // ===== Arc: Sky Pirates =====
  { id: "k5-arc3-1", name: "Black Sails", description: "Wyverns swoop on the granary.", arc: "sky_pirates", waveCount: 6, composition: ["wyvern", "wyvern", "bat", "goblin"], baseSpeedPxPerSec: 70, enemyCastleHp: 160, starThresholds: { needAccuracy: 84, needWords: 55 } },
  { id: "k5-arc3-2", name: "The Cloud Galleon", description: "A flying flagship rains down raiders.", arc: "sky_pirates", waveCount: 8, composition: ["wyvern", "bat", "berserker", "shaman"], baseSpeedPxPerSec: 75, enemyCastleHp: 220, starThresholds: { needAccuracy: 86, needWords: 80 } },
  { id: "k5-arc3-3", name: "Captain Vex", description: "Their leader will not retreat.", arc: "sky_pirates", waveCount: 10, composition: ["wyvern", "armored_orc", "berserker", "necromancer", "bat"], baseSpeedPxPerSec: 80, enemyCastleHp: 290, starThresholds: { needAccuracy: 88, needWords: 105 } },

  // ===== Arc: The Necromancer's Tower =====
  { id: "k5-arc4-1", name: "Marsh of Whispers", description: "A necromancer raises every skeleton you defeat.", arc: "necromancers_tower", waveCount: 7, composition: ["necromancer", "skeleton", "skeleton", "shaman"], baseSpeedPxPerSec: 55, enemyCastleHp: 190, starThresholds: { needAccuracy: 85, needWords: 70 } },
  { id: "k5-arc4-2", name: "The Black Spire", description: "Two necromancers, working in tandem.", arc: "necromancers_tower", waveCount: 9, composition: ["necromancer", "necromancer", "armored_orc", "wyvern"], baseSpeedPxPerSec: 60, enemyCastleHp: 260, starThresholds: { needAccuracy: 87, needWords: 90 } },
  { id: "k5-arc4-3", name: "The Lich Lord", description: "Boss: the Lich himself.", arc: "necromancers_tower", waveCount: 10, composition: ["lich", "necromancer", "armored_orc", "skeleton", "wyvern"], baseSpeedPxPerSec: 65, enemyCastleHp: 360, starThresholds: { needAccuracy: 90, needWords: 130 } },

  // ===== Arc: The Final Siege =====
  { id: "k5-arc5-1", name: "Outer Wall", description: "All factions converge on the moat.", arc: "the_final_siege", waveCount: 10, composition: ["goblin", "skeleton", "wyvern", "berserker", "necromancer"], baseSpeedPxPerSec: 75, enemyCastleHp: 320, starThresholds: { needAccuracy: 88, needWords: 120 } },
  { id: "k5-arc5-2", name: "Inner Keep", description: "They've breached the wall. Hold the keep.", arc: "the_final_siege", waveCount: 12, composition: ["armored_orc", "berserker", "wyvern", "necromancer", "shaman", "lich"], baseSpeedPxPerSec: 80, enemyCastleHp: 420, starThresholds: { needAccuracy: 90, needWords: 150 } },
  { id: "k5-arc5-3", name: "The Throne Room", description: "Three liches. Read like the world depends on it.", arc: "the_final_siege", waveCount: 15, composition: ["lich", "lich", "lich", "armored_orc", "necromancer", "berserker", "wyvern"], baseSpeedPxPerSec: 85, enemyCastleHp: 600, starThresholds: { needAccuracy: 92, needWords: 200 } },
];

const tier6to12: CampaignLevel[] = [
  // ===== Legacy arc (kept) =====
  { id: "t12-1", name: "Recon Sweep", description: "Drone scouts on the perimeter.", waveCount: 3, composition: ["goblin"], baseSpeedPxPerSec: 40, enemyCastleHp: 40, starThresholds: { needAccuracy: 75, needWords: 14 } },
  { id: "t12-2", name: "Cold Storage", description: "Reanimated guards — frost-immune.", waveCount: 4, composition: ["goblin", "skeleton"], baseSpeedPxPerSec: 45, enemyCastleHp: 55, starThresholds: { needAccuracy: 78, needWords: 22 } },
  { id: "t12-3", name: "Stealth Strike", description: "Surveillance drones bypass ground units.", waveCount: 5, composition: ["goblin", "bat", "skeleton"], baseSpeedPxPerSec: 50, enemyCastleHp: 70, starThresholds: { needAccuracy: 80, needWords: 30 } },
  { id: "t12-4", name: "Field Medic", description: "Shamans extract enemy assets — kill them first.", waveCount: 5, composition: ["goblin", "skeleton", "shaman"], baseSpeedPxPerSec: 55, enemyCastleHp: 90, starThresholds: { needAccuracy: 82, needWords: 38 } },
  { id: "t12-5", name: "Heavy Armor", description: "Mech-suited brutes.", waveCount: 6, composition: ["goblin", "orc", "skeleton"], baseSpeedPxPerSec: 55, enemyCastleHp: 110, starThresholds: { needAccuracy: 82, needWords: 45 } },
  { id: "t12-6", name: "Air & Ground", description: "Combined operations.", waveCount: 7, composition: ["goblin", "bat", "bat", "skeleton", "shaman"], baseSpeedPxPerSec: 60, enemyCastleHp: 135, starThresholds: { needAccuracy: 84, needWords: 55 } },
  { id: "t12-7", name: "Healer Cluster", description: "Their command post is mobile.", waveCount: 7, composition: ["goblin", "shaman", "shaman", "skeleton"], baseSpeedPxPerSec: 60, enemyCastleHp: 160, starThresholds: { needAccuracy: 85, needWords: 65 } },
  { id: "t12-8", name: "Armored Convoy", description: "Multiple armored units.", waveCount: 8, composition: ["goblin", "orc", "skeleton", "orc"], baseSpeedPxPerSec: 65, enemyCastleHp: 200, starThresholds: { needAccuracy: 86, needWords: 75 } },
  { id: "t12-9", name: "Dark Skies", description: "Air superiority must be denied.", waveCount: 8, composition: ["bat", "bat", "bat", "goblin", "shaman"], baseSpeedPxPerSec: 70, enemyCastleHp: 220, starThresholds: { needAccuracy: 86, needWords: 85 } },
  { id: "t12-10", name: "The Director's Vault", description: "Take down their command keep.", waveCount: 10, composition: ["goblin", "skeleton", "shaman", "bat", "orc"], baseSpeedPxPerSec: 75, enemyCastleHp: 300, starThresholds: { needAccuracy: 88, needWords: 110 } },

  // ===== Arc: The Goblin King's Return (6-12 reskin: "Insurgent Resurgence") =====
  { id: "t12-arc1-1", name: "Border Sweep", description: "Insurgent cells probe the eastern checkpoint.", arc: "goblin_kings_return", waveCount: 6, composition: ["goblin", "skeleton", "berserker"], baseSpeedPxPerSec: 55, enemyCastleHp: 130, starThresholds: { needAccuracy: 82, needWords: 45 } },
  { id: "t12-arc1-2", name: "Forest Ambush", description: "Berserker squads break cover.", arc: "goblin_kings_return", waveCount: 7, composition: ["berserker", "armored_orc", "shaman"], baseSpeedPxPerSec: 60, enemyCastleHp: 180, starThresholds: { needAccuracy: 84, needWords: 55 } },
  { id: "t12-arc1-3", name: "The Iron Pass", description: "Armored convoy under air cover.", arc: "goblin_kings_return", waveCount: 8, composition: ["armored_orc", "wyvern", "berserker", "shaman"], baseSpeedPxPerSec: 65, enemyCastleHp: 230, starThresholds: { needAccuracy: 86, needWords: 75 } },
  { id: "t12-arc1-4", name: "Air Cavalry", description: "Wyverns and drones.", arc: "goblin_kings_return", waveCount: 9, composition: ["wyvern", "bat", "armored_orc", "shaman"], baseSpeedPxPerSec: 75, enemyCastleHp: 280, starThresholds: { needAccuracy: 87, needWords: 90 } },
  { id: "t12-arc1-5", name: "The Commander's Stand", description: "Their warlord refuses to fall back.", arc: "goblin_kings_return", waveCount: 10, composition: ["armored_orc", "berserker", "wyvern", "necromancer", "shaman"], baseSpeedPxPerSec: 80, enemyCastleHp: 380, starThresholds: { needAccuracy: 89, needWords: 130 } },

  // ===== Arc: Frost Invasion =====
  { id: "t12-arc2-1", name: "Frozen Frontier", description: "Cold-resistant infantry crosses the line.", arc: "frost_invasion", waveCount: 7, composition: ["skeleton", "armored_orc", "berserker"], baseSpeedPxPerSec: 60, enemyCastleHp: 200, starThresholds: { needAccuracy: 84, needWords: 65 } },
  { id: "t12-arc2-2", name: "Glacier Wyverns", description: "Air superiority must be denied.", arc: "frost_invasion", waveCount: 8, composition: ["wyvern", "wyvern", "armored_orc", "shaman"], baseSpeedPxPerSec: 70, enemyCastleHp: 240, starThresholds: { needAccuracy: 86, needWords: 80 } },
  { id: "t12-arc2-3", name: "Vanguard Push", description: "Heavy infantry in coordinated waves.", arc: "frost_invasion", waveCount: 9, composition: ["berserker", "armored_orc", "necromancer", "shaman"], baseSpeedPxPerSec: 65, enemyCastleHp: 290, starThresholds: { needAccuracy: 88, needWords: 100 } },
  { id: "t12-arc2-4", name: "The Crown Fortress", description: "Final push on the icebound keep.", arc: "frost_invasion", waveCount: 11, composition: ["berserker", "armored_orc", "wyvern", "necromancer", "lich"], baseSpeedPxPerSec: 75, enemyCastleHp: 400, starThresholds: { needAccuracy: 90, needWords: 140 } },

  // ===== Arc: Sky Pirates =====
  { id: "t12-arc3-1", name: "Black Sails", description: "Wyvern wing strikes the warehouses.", arc: "sky_pirates", waveCount: 7, composition: ["wyvern", "wyvern", "bat", "berserker"], baseSpeedPxPerSec: 75, enemyCastleHp: 210, starThresholds: { needAccuracy: 86, needWords: 75 } },
  { id: "t12-arc3-2", name: "The Cloud Galleon", description: "Flagship-launched assault force.", arc: "sky_pirates", waveCount: 9, composition: ["wyvern", "bat", "armored_orc", "shaman"], baseSpeedPxPerSec: 80, enemyCastleHp: 280, starThresholds: { needAccuracy: 88, needWords: 100 } },
  { id: "t12-arc3-3", name: "Captain Vex", description: "Their captain leads the final wing.", arc: "sky_pirates", waveCount: 11, composition: ["wyvern", "armored_orc", "berserker", "necromancer", "bat"], baseSpeedPxPerSec: 85, enemyCastleHp: 360, starThresholds: { needAccuracy: 90, needWords: 130 } },

  // ===== Arc: The Necromancer's Tower =====
  { id: "t12-arc4-1", name: "Marsh of Whispers", description: "Reanimation engine — kill the casters fast.", arc: "necromancers_tower", waveCount: 8, composition: ["necromancer", "skeleton", "armored_orc", "shaman"], baseSpeedPxPerSec: 60, enemyCastleHp: 240, starThresholds: { needAccuracy: 87, needWords: 90 } },
  { id: "t12-arc4-2", name: "The Black Spire", description: "Twin reanimators, layered defenses.", arc: "necromancers_tower", waveCount: 10, composition: ["necromancer", "necromancer", "armored_orc", "wyvern", "berserker"], baseSpeedPxPerSec: 65, enemyCastleHp: 320, starThresholds: { needAccuracy: 89, needWords: 115 } },
  { id: "t12-arc4-3", name: "The Lich Lord", description: "Boss: the Lich. Bring everything.", arc: "necromancers_tower", waveCount: 12, composition: ["lich", "necromancer", "armored_orc", "wyvern", "berserker"], baseSpeedPxPerSec: 70, enemyCastleHp: 460, starThresholds: { needAccuracy: 91, needWords: 160 } },

  // ===== Arc: The Final Siege =====
  { id: "t12-arc5-1", name: "Outer Wall", description: "All factions, all at once.", arc: "the_final_siege", waveCount: 12, composition: ["goblin", "skeleton", "wyvern", "berserker", "necromancer", "armored_orc"], baseSpeedPxPerSec: 80, enemyCastleHp: 400, starThresholds: { needAccuracy: 90, needWords: 150 } },
  { id: "t12-arc5-2", name: "Inner Keep", description: "Hold the keep. No retreat.", arc: "the_final_siege", waveCount: 14, composition: ["armored_orc", "berserker", "wyvern", "necromancer", "shaman", "lich"], baseSpeedPxPerSec: 85, enemyCastleHp: 540, starThresholds: { needAccuracy: 92, needWords: 190 } },
  { id: "t12-arc5-3", name: "The Throne Room", description: "Three liches, three legions. End it.", arc: "the_final_siege", waveCount: 18, composition: ["lich", "lich", "lich", "armored_orc", "necromancer", "berserker", "wyvern"], baseSpeedPxPerSec: 90, enemyCastleHp: 750, starThresholds: { needAccuracy: 94, needWords: 250 } },
];

export function getCampaignLevels(mode: GradeMode): CampaignLevel[] {
  return mode === "6to12" ? tier6to12 : k5Levels;
}

export function getLevelById(mode: GradeMode, id: string): CampaignLevel | undefined {
  return getCampaignLevels(mode).find(l => l.id === id);
}

/** Group levels by arc for display in the campaign select screen. */
export function getCampaignArcs(mode: GradeMode): Array<{ arc: CastleArc | null; levels: CampaignLevel[] }> {
  const levels = getCampaignLevels(mode);
  const groups = new Map<string, CampaignLevel[]>();
  const order: string[] = [];
  for (const lvl of levels) {
    const key = lvl.arc || "_legacy";
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    groups.get(key)!.push(lvl);
  }
  return order.map(key => ({
    arc: key === "_legacy" ? null : CASTLE_ARCS[key as CastleArcId],
    levels: groups.get(key)!,
  }));
}
