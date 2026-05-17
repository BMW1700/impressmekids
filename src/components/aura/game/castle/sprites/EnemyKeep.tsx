import { memo } from "react";
import { motion } from "framer-motion";

interface Props {
  hp: number;
  maxHp: number;
}

/**
 * Enemy keep (left side) — dark, jagged variant of the player castle.
 * Only shown in campaign mode.
 */
export const EnemyKeep = memo(({ hp, maxHp }: Props) => {
  const pct = maxHp > 0 ? Math.max(0, hp / maxHp) : 0;
  const showCracks = pct < 0.66;
  const showSmoke = pct < 0.25;

  return (
    <div className="relative" style={{ width: 140, height: 190 }}>
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="text-[10px] font-black text-rose-300 tracking-wider drop-shadow">ENEMY KEEP</div>
        <div className="w-24 h-2 mx-auto bg-slate-900/80 rounded-full overflow-hidden border border-rose-900/60 mt-1">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-red-700 transition-all"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="text-[9px] text-rose-200/80 mt-0.5">{Math.max(0, Math.round(hp))} / {maxHp}</div>
      </div>

      {showSmoke && (
        <motion.div
          className="absolute -top-2 left-6 w-7 h-7 rounded-full bg-slate-800/70"
          animate={{ y: [-4, -24], opacity: [0.7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <svg viewBox="0 0 140 190" width={140} height={190} className="drop-shadow-2xl">
        <ellipse cx="70" cy="186" rx="58" ry="6" fill="#000" opacity="0.4" />

        {/* base wall — darker stone */}
        <rect x="10" y="100" width="120" height="86" fill="#3a3340" />
        <rect x="10" y="100" width="120" height="86" fill="url(#darkStone)" opacity="0.5" />

        {/* jagged crenellations */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <polygon
            key={i}
            points={`${14 + i * 20},92 ${20 + i * 20},80 ${26 + i * 20},92`}
            fill="#3a3340"
          />
        ))}

        {/* dark tower */}
        <rect x="45" y="40" width="50" height="90" fill="#4a3d52" />
        <rect x="45" y="40" width="50" height="90" fill="url(#darkStone)" opacity="0.5" />
        {/* twisted spire crenellations */}
        {[0, 1, 2].map(i => (
          <polygon
            key={i}
            points={`${48 + i * 16},42 ${56 + i * 16},28 ${64 + i * 16},42`}
            fill="#4a3d52"
          />
        ))}

        {/* glowing red windows */}
        <rect x="55" y="60" width="8" height="14" fill="#ff2d2d" opacity="0.85" />
        <rect x="77" y="60" width="8" height="14" fill="#ff2d2d" opacity="0.85" />
        <rect x="55" y="92" width="6" height="10" fill="#ff2d2d" opacity="0.7" />
        <rect x="79" y="92" width="6" height="10" fill="#ff2d2d" opacity="0.7" />

        {/* iron gate */}
        <rect x="58" y="150" width="24" height="36" fill="#1a1a1a" />
        <line x1="64" y1="150" x2="64" y2="186" stroke="#3a3a3a" strokeWidth="1" />
        <line x1="70" y1="150" x2="70" y2="186" stroke="#3a3a3a" strokeWidth="1" />
        <line x1="76" y1="150" x2="76" y2="186" stroke="#3a3a3a" strokeWidth="1" />

        {showCracks && (
          <g stroke="#000" strokeWidth="1.4" fill="none" opacity="0.8">
            <path d="M22 110 L34 130 L28 150" />
            <path d="M108 120 L96 140 L104 160" />
            {pct < 0.33 && <path d="M50 80 L58 100 L52 120" />}
          </g>
        )}

        <defs>
          <pattern id="darkStone" patternUnits="userSpaceOnUse" width="18" height="18">
            <rect width="18" height="18" fill="none" />
            <line x1="0" y1="9" x2="18" y2="9" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
            <line x1="9" y1="0" x2="9" y2="9" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
            <line x1="0" y1="9" x2="0" y2="18" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
});
EnemyKeep.displayName = "EnemyKeep";
