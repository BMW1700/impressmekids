import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Lock, Check, Trophy, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useSeasonPass } from '@/hooks/useSeasonPass';
import { CURRENT_SEASON, questLabel } from '@/lib/rpgSeasonPass';
import { useToast } from '@/hooks/use-toast';
import { RPGLeaderboardPanel } from './RPGLeaderboardPanel';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Daily Quests + Season Pass overlay.
 * Purely cosmetic rewards (titles/banners/badges) so this is additive
 * and cannot alter combat balance.
 */
export const RPGDailyHubPanel = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState<'quests' | 'ranks'>('quests');
  const { quests, loading: qLoading, refresh: refreshQuests } = useDailyQuests();
  const { xp_total, claimed_tiers, loading: sLoading, claimTier, refresh: refreshPass } = useSeasonPass();
  const { toast } = useToast();

  const maxXp = CURRENT_SEASON.tiers[CURRENT_SEASON.tiers.length - 1].requiredXp;

  const handleClaim = async (tier: number, requiredXp: number, label: string, emoji: string) => {
    const ok = await claimTier(tier, requiredXp);
    if (ok) {
      toast({ title: `${emoji} Reward claimed!`, description: label });
      void refreshPass();
    } else {
      toast({ title: 'Cannot claim yet', description: 'Earn more XP or refresh.' });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-2xl bg-card rounded-2xl border-2 shadow-2xl my-8"
            style={{ borderColor: CURRENT_SEASON.themeColor }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
              style={{ background: `linear-gradient(135deg, ${CURRENT_SEASON.themeColor}, ${CURRENT_SEASON.themeColor}cc)` }}
            >
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="h-6 w-6" />
                <div>
                  <div className="text-xs tracking-widest opacity-80">SEASON</div>
                  <div className="text-lg font-black">{CURRENT_SEASON.name}</div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Daily Quests */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-black tracking-widest uppercase">Today's Quests</h3>
                </div>
                {qLoading ? (
                  <div className="text-sm text-muted-foreground">Loading quests…</div>
                ) : (
                  <div className="space-y-2">
                    {quests.map((q) => {
                      const meta = questLabel(q.quest_type);
                      const pct = Math.min(100, (q.current_count / q.target_count) * 100);
                      const done = !!q.completed_at;
                      return (
                        <div key={q.id} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <span className="text-lg">{meta.emoji}</span>
                              <span>{meta.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono">{q.current_count}/{q.target_count}</span>
                              {done ? (
                                <span className="flex items-center gap-1 text-green-500 font-bold">
                                  <Check className="h-3 w-3" /> +{q.xp_reward} XP
                                </span>
                              ) : (
                                <span className="text-muted-foreground">+{q.xp_reward} XP</span>
                              )}
                            </div>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                    <Button size="sm" variant="ghost" onClick={() => void refreshQuests()} className="w-full">
                      Refresh
                    </Button>
                  </div>
                )}
              </section>

              {/* Season Pass */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black tracking-widest uppercase">Season Pass</h3>
                  <span className="text-xs font-mono text-muted-foreground">
                    {xp_total} / {maxXp} XP
                  </span>
                </div>
                <Progress value={Math.min(100, (xp_total / maxXp) * 100)} className="h-3 mb-4" />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CURRENT_SEASON.tiers.map((t) => {
                    const claimed = claimed_tiers.includes(t.tier);
                    const eligible = xp_total >= t.requiredXp && !claimed;
                    return (
                      <div
                        key={t.tier}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          claimed ? 'border-green-500 bg-green-500/10' :
                          eligible ? 'border-primary bg-primary/10 animate-pulse' :
                          'border-muted bg-muted/20 opacity-60'
                        }`}
                      >
                        <div className="text-xs font-bold text-muted-foreground mb-1">
                          TIER {t.tier} · {t.requiredXp} XP
                        </div>
                        <div className="text-3xl mb-1">{t.rewardEmoji}</div>
                        <div className="text-xs font-semibold mb-2 truncate">{t.rewardLabel}</div>
                        {claimed ? (
                          <div className="text-xs text-green-500 font-bold flex items-center justify-center gap-1">
                            <Check className="h-3 w-3" /> Claimed
                          </div>
                        ) : eligible ? (
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            disabled={sLoading}
                            onClick={() => void handleClaim(t.tier, t.requiredXp, t.rewardLabel, t.rewardEmoji)}
                          >
                            Claim
                          </Button>
                        ) : (
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
