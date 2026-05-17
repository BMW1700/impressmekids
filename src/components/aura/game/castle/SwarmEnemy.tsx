import { memo } from "react";
import { ENEMY_TYPES, EnemyType } from "./enemyTypes";
import { SwarmEnemySprite } from "./sprites/SwarmEnemySprite";

interface Props {
  type: EnemyType;
  hp: number;
  maxHp: number;
  flying?: boolean;
  takingDamage?: boolean;
}

/**
 * Renders one enemy with HP bar + label using dedicated SVG sprites.
 */
export const SwarmEnemy = memo(({ type, hp, maxHp, flying, takingDamage }: Props) => {
  const def = ENEMY_TYPES[type];
  const size = Math.round(56 * def.scale);
  return (
    <div className="flex flex-col items-center pointer-events-none" style={{ transform: flying ? "translateY(-32px)" : undefined }}>
      <div className="w-14 h-1.5 bg-slate-900/80 rounded-full overflow-hidden mb-0.5 border border-slate-700">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-red-600 transition-all"
          style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
        />
      </div>
      <div className="text-[9px] text-rose-100 leading-none mb-0.5 font-bold drop-shadow">
        {Math.max(0, Math.ceil(hp))} HP
      </div>
      <SwarmEnemySprite type={type} size={size} takingDamage={takingDamage} />
      <div className="text-[9px] text-slate-200 mt-0.5 leading-none drop-shadow">{def.label}</div>
    </div>
  );
});
SwarmEnemy.displayName = "SwarmEnemy";
