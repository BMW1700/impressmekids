import { useEffect, useState, useCallback } from "react";
import { Coins, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_ROSTER, HeroDef } from "./heroRoster";
import { HeroSprite } from "./HeroSprite";

interface Props {
  coins: number;
  unlockedHeroIds: Set<string>;
  cooldownsUntil: Record<string, number>;
  activeCountByHero: Record<string, number>;
  onSummon: (heroId: string) => void;
  /** Called when player taps a locked shop hero to buy it with coins. */
  onBuyShop?: (heroId: string) => void;
  perHeroCap?: number;
}

const ROLE_RING: Record<string, string> = {
  wall: "ring-emerald-500/60",
  front: "ring-blue-500/60",
  support: "ring-fuchsia-500/60",
};

export const SummonBar = ({
  coins, unlockedHeroIds, cooldownsUntil, activeCountByHero,
  onSummon, perHeroCap = 3,
}: Props) => {
  // Re-render the cooldown rings smoothly without driving the whole arena.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1_000_000), 200);
    return () => clearInterval(id);
  }, []);

  // Show owned heroes first, then 1 row of locked teaser cards at the end.
  const owned = HERO_ROSTER.filter(h => unlockedHeroIds.has(h.id));
  const locked = HERO_ROSTER.filter(h => !unlockedHeroIds.has(h.id));

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto py-1.5 px-1 -mx-1 scrollbar-thin scrollbar-thumb-slate-700/60"
      aria-label="Hero summons"
    >
      {owned.map(h => (
        <HeroCard
          key={h.id}
          hero={h}
          coins={coins}
          cooldownsUntil={cooldownsUntil[h.id] ?? 0}
          activeCount={activeCountByHero[h.id] ?? 0}
          perHeroCap={perHeroCap}
          onSummon={() => onSummon(h.id)}
        />
      ))}
      {locked.length > 0 && (
        <div className="shrink-0 flex items-center pl-2 pr-1 mx-1 text-[10px] text-slate-500 border-l border-slate-700/50">
          Locked
        </div>
      )}
      {locked.map(h => (
        <HeroCard
          key={h.id}
          hero={h}
          coins={coins}
          cooldownsUntil={0}
          activeCount={0}
          perHeroCap={perHeroCap}
          onSummon={() => { /* no-op when locked */ }}
          locked
        />
      ))}
    </div>
  );
};

const HeroCard = ({
  hero, coins, cooldownsUntil, activeCount, perHeroCap, onSummon, locked,
}: {
  hero: HeroDef;
  coins: number;
  cooldownsUntil: number;
  activeCount: number;
  perHeroCap: number;
  onSummon: () => void;
  locked?: boolean;
}) => {
  const now = Date.now();
  const cdRemain = Math.max(0, cooldownsUntil - now);
  const cdPct = cdRemain > 0 ? Math.min(100, (cdRemain / hero.cooldownMs) * 100) : 0;
  const tooBroke = coins < hero.summonCost;
  const atCap = activeCount >= perHeroCap;
  const disabled = locked || tooBroke || cdRemain > 0 || atCap;
  const reason = locked ? "Locked" : tooBroke ? "Not enough coins" : cdRemain > 0 ? "Cooling down" : atCap ? "Max active" : `Summon ${hero.name}`;

  return (
    <button
      type="button"
      onClick={() => !disabled && onSummon()}
      title={`${hero.name} — ${hero.blurb}\n${reason}`}
      className={cn(
        "shrink-0 relative w-14 h-16 rounded-lg bg-slate-900/80 border border-slate-700/80 flex flex-col items-center justify-start p-1 transition",
        "ring-2 ring-transparent",
        ROLE_RING[hero.role],
        !disabled && "hover:scale-[1.04] active:scale-95 hover:border-amber-400/70",
        disabled && "opacity-60 grayscale",
      )}
      disabled={disabled}
      aria-label={reason}
    >
      <div className="relative">
        <HeroSprite hero={hero} size={34} locked={locked} />
        {cdRemain > 0 && (
          <div
            className="absolute inset-0 rounded-md bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center"
            style={{ height: `${cdPct}%` }}
          >
            <span className="text-[10px] text-white font-bold">{Math.ceil(cdRemain / 1000)}s</span>
          </div>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-0.5 text-[10px] font-bold">
        {locked ? (
          <span className="text-slate-400 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /></span>
        ) : (
          <>
            <Coins className="w-2.5 h-2.5 text-amber-300" />
            <span className={cn(tooBroke ? "text-rose-300" : "text-amber-200")}>{hero.summonCost}</span>
          </>
        )}
      </div>
    </button>
  );
};
