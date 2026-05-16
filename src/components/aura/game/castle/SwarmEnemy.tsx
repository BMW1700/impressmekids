import { memo } from "react";
import { MiniGoblin } from "@/components/aura/game/rpg/MiniGoblin";
import { ENEMY_TYPES, EnemyType } from "./enemyTypes";

interface Props {
  type: EnemyType;
  hp: number;
  maxHp: number;
  flying?: boolean;
}

/**
 * Renders one enemy with HP bar. Uses MiniGoblin SVG with CSS filter tints
 * to keep the asset count low while differentiating types visually.
 */
export const SwarmEnemy = memo(({ type, hp, maxHp, flying }: Props) => {
  const def = ENEMY_TYPES[type];
  const baseSize = 44;
  const size = baseSize * def.scale;
  return (
    <div className="flex flex-col items-center pointer-events-none" style={{ transform: flying ? "translateY(-30px)" : undefined }}>
      <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-red-500" style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }} />
      </div>
      <div className={def.tint} style={{ filter: undefined }}>
        <MiniGoblin size={size} />
      </div>
      <div className="text-[9px] text-slate-300 mt-0.5 leading-none">{def.label}</div>
    </div>
  );
});
SwarmEnemy.displayName = "SwarmEnemy";
