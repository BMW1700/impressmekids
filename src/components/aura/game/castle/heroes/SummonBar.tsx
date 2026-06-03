import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_ROSTER, HeroDef } from "./heroRoster";
import { HeroSprite } from "./HeroSprite";

interface Props {
  /** Available mana this match (used to summon heroes). */
  mana: number;
  unlockedHeroIds: Set<string>;
  cooldownsUntil: Record<string, number>;
  activeCountByHero: Record<string, number>;
  onSummon: (heroId: string) => void;
  perHeroCap?: number;
}

const ROLE_RING: Record<string, string> = {
  wall: "ring-emerald-500/60",
  front: "ring-blue-500/60",
  support: "ring-fuchsia-500/60",
};

export const SummonBar = ({
  mana, unlockedHeroIds, cooldownsUntil, activeCountByHero,
  onSummon, perHeroCap = 3,
}: Props) => {
  // Re-render cooldown rings smoothly without driving the whole arena.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1_000_000), 250);
    return () => clearInterval(id);
  }, []);

  // Owned heroes ONLY — locked / shop heroes live in the upgrades panel.
  const owned = HERO_ROSTER.filter(h => unlockedHeroIds.has(h.id));

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 -mx-1 scrollbar-thin scrollbar-thumb-slate-700/60"
      aria-label="Hero summons"
    >
      {owned.map(h => (
        <HeroCard
          key={h.id}
          hero={h}
          mana={mana}
          cooldownsUntil={cooldownsUntil[h.id] ?? 0}
          activeCount={activeCountByHero[h.id] ?? 0}
          perHeroCap={perHeroCap}
          onSummon={() => onSummon(h.id)}
        />
      ))}
      {owned.length === 0 && (
        <div className="text-[10px] text-slate-400 px-2">
          Earn heroes by clearing campaign levels.
        </div>
      )}
    </div>
  );
};

const HeroCard = ({
  hero, mana, cooldownsUntil, activeCount, perHeroCap, onSummon,
}: {
  hero: HeroDef;
  mana: number;
  cooldownsUntil: number;
  activeCount: number;
  perHeroCap: number;
  onSummon: () => void;
}) => {
  const now = Date.now();
  const cdRemain = Math.max(0, cooldownsUntil - now);
  const cdPct = cdRemain > 0 ? Math.min(100, (cdRemain / hero.cooldownMs) * 100) : 0;
  const tooBroke = mana < hero.summonCost;
  const atCap = activeCount >= perHeroCap;

  const disabled = tooBroke || cdRemain > 0 || atCap;

  const reason = tooBroke ? "Not enough mana"
    : cdRemain > 0 ? "Cooling down"
    : atCap ? "Max active"
    : `Summon ${hero.name}`;

  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onSummon(); }}
      title={`${hero.name} — ${hero.blurb}\n${reason}`}
      className={cn(
        "shrink-0 relative w-12 h-14 rounded-lg bg-slate-900/80 border border-slate-700/80 flex flex-col items-center justify-start p-0.5 transition",
        "ring-2 ring-transparent",
        ROLE_RING[hero.role],
        !disabled && "hover:scale-[1.05] active:scale-95 hover:border-amber-400/70",
        disabled && "opacity-60 grayscale",
      )}
      disabled={disabled}
      aria-label={reason}
    >
      <div className="relative">
        <HeroSprite hero={hero} size={32} />
        {cdRemain > 0 && (
          <div
            className="absolute inset-x-0 top-0 rounded-md bg-slate-950/60 backdrop-blur-[1px] flex items-end justify-center"
            style={{ height: `${cdPct}%` }}
          >
            <span className="text-[9px] text-white font-bold">{Math.ceil(cdRemain / 1000)}s</span>
          </div>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold leading-none">
        <Sparkles className="w-2.5 h-2.5 text-sky-300" />
        <span className={cn(tooBroke ? "text-rose-300" : "text-sky-200")}>{hero.summonCost}</span>
      </div>
    </button>
  );
};
