import { EnemyKeep } from "./sprites/EnemyKeep";

interface Props {
  hp: number;
  maxHp: number;
}

/**
 * Legacy wrapper kept for compatibility — delegates to EnemyKeep SVG.
 */
export const EnemyCastle = ({ hp, maxHp }: Props) => {
  return (
    <div className="absolute left-2 bottom-2 z-10">
      <EnemyKeep hp={hp} maxHp={maxHp} />
    </div>
  );
};
