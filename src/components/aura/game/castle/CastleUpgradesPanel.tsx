import { Button } from "@/components/ui/button";
import { Coins, Heart, Sword, Users, Lock, Coins as CoinsIcon, Zap, Crown, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCastleUpgrades, upgradeCost, UpgradeTrack } from "@/hooks/useCastleUpgrades";
import { useCastleHeroes } from "@/hooks/useCastleHeroes";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredTheme, getGradeMode } from "@/lib/gameTheme";
import { useCastleCrowns } from "@/lib/castleCrowns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { HERO_ROSTER, heroCrownUnlockPrice, heroUpgradeCost } from "./heroes/heroRoster";
import { HeroSprite } from "./heroes/HeroSprite";

const TRACK_META: Record<UpgradeTrack, { label: string; description: string; icon: typeof Heart; color: string }> = {
  hp_level:         { label: "Knight HP",      description: "+1 HP per knight per level",   icon: Heart,     color: "text-rose-400" },
  damage_level:     { label: "Knight Damage",  description: "+0.6 DPS per level",           icon: Sword,     color: "text-amber-400" },
  cap_level:        { label: "Summon Cap",     description: "+1 max active knight",         icon: Users,     color: "text-cyan-400" },
  gold_find_level:  { label: "Gold Find",      description: "+10% coins from waves & words", icon: CoinsIcon, color: "text-yellow-300" },
  crit_level:       { label: "Critical Strike", description: "+5% chance to double knight hits", icon: Zap,   color: "text-fuchsia-400" },
};

export const CastleUpgradesPanel = () => {
  const { user } = useAuth();
  const gradeMode = getGradeMode(getStoredTheme());
  const { upgrades, buy } = useCastleUpgrades();
  const { unlockedIds, heroLevels, buyShopUnlock, buyHeroLevel, unlockFromShop } = useCastleHeroes();
  const { progress } = useCampaignProgress(user?.id, gradeMode);
  const { crowns, spend } = useCastleCrowns();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const coins = progress?.total_gold ?? 0;

  const handleBuy = async (track: UpgradeTrack) => {
    const cost = upgradeCost(upgrades[track] as number);
    if (!cost || coins < cost || !user?.id || busy) return;
    setBusy(track);
    try {
      const result = await buy({ track, cost });
      toast({
        title: "Upgrade purchased!",
        description: `${TRACK_META[track].label} → Lv ${result.new_level}. ${result.balance} 🪙 left.`,
      });
    } catch (e: any) {
      toast({
        title: "Purchase failed",
        description: e?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleHeroCoinUnlock = async (heroId: string, cost: number) => {
    if (busy || coins < cost) return;
    setBusy(`unlock:${heroId}`);
    try {
      const result = await buyShopUnlock(heroId, cost);
      const hero = HERO_ROSTER.find(h => h.id === heroId);
      toast({ title: "Hero unlocked!", description: `${hero?.name ?? "Hero"} is ready. ${result.balance} 🪙 left.` });
    } catch (e: any) {
      toast({ title: "Purchase failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleHeroCrownUnlock = async (heroId: string, cost: number) => {
    if (busy || crowns < cost) return;
    setBusy(`crown:${heroId}`);
    try {
      if (!spend(cost)) throw new Error("Not enough crowns");
      await unlockFromShop(heroId);
      const hero = HERO_ROSTER.find(h => h.id === heroId);
      toast({ title: "Hero unlocked!", description: `${hero?.name ?? "Hero"} joined your roster.` });
    } catch (e: any) {
      toast({ title: "Purchase failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleHeroUpgrade = async (heroId: string, cost: number) => {
    if (busy || coins < cost) return;
    setBusy(`level:${heroId}`);
    try {
      const result = await buyHeroLevel(heroId, cost);
      const hero = HERO_ROSTER.find(h => h.id === heroId);
      toast({ title: "Hero upgraded!", description: `${hero?.name ?? "Hero"} → Lv ${result.new_level}. ${result.balance} 🪙 left.` });
    } catch (e: any) {
      toast({ title: "Upgrade failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Castle Shop</h3>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="flex items-center gap-1 text-amber-300"><Coins className="w-4 h-4" /> {coins.toLocaleString()}</span>
          <span className="flex items-center gap-1 text-fuchsia-300"><Crown className="w-4 h-4" /> {crowns.toLocaleString()}</span>
        </div>
      </div>

      <Tabs defaultValue="heroes" className="w-full">
        <TabsList className="grid grid-cols-2 bg-slate-950/70">
          <TabsTrigger value="heroes">Heroes</TabsTrigger>
          <TabsTrigger value="castle">Castle</TabsTrigger>
        </TabsList>

        <TabsContent value="heroes" className="space-y-2 mt-3">
          {HERO_ROSTER.map(hero => {
            const owned = unlockedIds.has(hero.id);
            const lvl = heroLevels[hero.id] ?? 0;
            const upgrade = owned ? heroUpgradeCost(lvl) : null;
            const coinUnlock = hero.unlock.kind === "shop" ? hero.unlock.price : null;
            const crownUnlock = !owned ? heroCrownUnlockPrice(hero) : null;
            const canBuyWithCoins = coinUnlock !== null && coins >= coinUnlock;
            const canUpgrade = upgrade !== null && coins >= upgrade;
            return (
              <div key={hero.id} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-3">
                <HeroSprite hero={hero} size={50} level={lvl} locked={!owned} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-bold truncate">{hero.name}</span>
                    {owned ? <span className="text-[10px] text-sky-200 font-black">Lv {lvl}/5</span> : <Lock className="w-3 h-3 text-slate-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{hero.blurb}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-sky-300" /> Summon {hero.summonCost} mana
                  </div>
                </div>
                {owned ? (
                  upgrade === null ? (
                    <span className="text-xs text-emerald-300 font-black">MAX</span>
                  ) : (
                    <Button size="sm" onClick={() => handleHeroUpgrade(hero.id, upgrade)} disabled={busy === `level:${hero.id}` || !canUpgrade}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-bold disabled:bg-slate-700 disabled:text-slate-400">
                      {coins < upgrade && <Lock className="w-3 h-3 mr-1" />}
                      {upgrade} 🪙
                    </Button>
                  )
                ) : (
                  <div className="flex flex-col gap-1 shrink-0">
                    {coinUnlock !== null && (
                      <Button size="sm" onClick={() => handleHeroCoinUnlock(hero.id, coinUnlock)} disabled={busy === `unlock:${hero.id}` || !canBuyWithCoins}
                        className="h-7 bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:bg-slate-700 disabled:text-slate-400">
                        {coinUnlock} 🪙
                      </Button>
                    )}
                    {crownUnlock !== null && crownUnlock > 0 && (
                      <Button size="sm" onClick={() => handleHeroCrownUnlock(hero.id, crownUnlock)} disabled={busy === `crown:${hero.id}` || crowns < crownUnlock}
                        className="h-7 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold disabled:bg-slate-700 disabled:text-slate-400">
                        {crownUnlock} 👑
                      </Button>
                    )}
                    {coinUnlock === null && <span className="text-[10px] text-slate-500 max-w-20 text-right">{hero.unlock.kind === "campaign" ? hero.unlock.description : "Locked"}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="castle" className="space-y-2 mt-3">
          {(Object.keys(TRACK_META) as UpgradeTrack[]).map(track => {
            const meta = TRACK_META[track];
            const lvl = upgrades[track] as number;
            const cost = upgradeCost(lvl);
            const maxed = cost === null;
            const Icon = meta.icon;
            return (
              <div key={track} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold flex items-center gap-2">
                    {meta.label} <span className="text-xs text-slate-400">Lv {lvl}/5</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{meta.description}</div>
                </div>
                {maxed ? (
                  <span className="text-xs text-emerald-300 font-bold">MAX</span>
                ) : (
                  <Button size="sm" onClick={() => handleBuy(track)} disabled={busy === track || coins < cost!}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:bg-slate-700 disabled:text-slate-400">
                    {coins < cost! && <Lock className="w-3 h-3 mr-1" />}
                    {cost} 🪙
                  </Button>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
      <p className="text-[10px] text-slate-500 text-center pt-1">Coins come from reading; crowns are the premium shortcut.</p>
    </div>
  );
};
