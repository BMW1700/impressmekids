import { motion } from 'framer-motion';
import { tierMeta } from '@/lib/rpgRanks';

interface Props {
  tier: string;
  points?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RPGRankBadge = ({ tier, points, size = 'md', showLabel = true }: Props) => {
  const meta = tierMeta(tier);
  const sizeCls =
    size === 'sm' ? 'text-xs px-2 py-1 gap-1' :
    size === 'lg' ? 'text-base px-4 py-2 gap-2' :
    'text-sm px-3 py-1.5 gap-1.5';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center rounded-full border font-bold backdrop-blur ${meta.bgClass} ${meta.textClass} ${sizeCls}`}
      style={{ borderColor: `${meta.color}66` }}
    >
      <span>{meta.emoji}</span>
      {showLabel && <span className="tracking-wide uppercase">{meta.label}</span>}
      {points !== undefined && (
        <span className="font-mono opacity-80">{points}</span>
      )}
    </motion.div>
  );
};
