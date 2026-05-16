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
}

const k5Levels: CampaignLevel[] = [
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
];

const tier6to12: CampaignLevel[] = [
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
];

export function getCampaignLevels(mode: GradeMode): CampaignLevel[] {
  return mode === "6to12" ? tier6to12 : k5Levels;
}

export function getLevelById(mode: GradeMode, id: string): CampaignLevel | undefined {
  return getCampaignLevels(mode).find(l => l.id === id);
}
