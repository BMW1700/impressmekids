import { motion } from 'framer-motion';
import { Trophy, Crown, Loader2 } from 'lucide-react';
import { useLeaderboard, useMyRank } from '@/hooks/useRPGRanks';
import { supabase } from '@/integrations/supabase/client';
import { RPGRankBadge } from './RPGRankBadge';
import { useEffect, useState } from 'react';
import { RANK_TIERS, nextTier, tierMeta } from '@/lib/rpgRanks';

export const RPGLeaderboardPanel = () => {
  const { rows, loading } = useLeaderboard(100);
  const { rank } = useMyRank();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
  }, []);

  const myPos = rows.findIndex((r) => r.user_id === uid) + 1;
  const meta = rank ? tierMeta(rank.tier) : tierMeta('bronze');
  const nxt = rank ? nextTier(rank.tier) : null;

  return (
    <div className="space-y-4">
      {/* My rank card */}
      {rank && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border-2 p-4 ${meta.bgClass}`}
          style={{ borderColor: meta.color }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{meta.emoji}</div>
              <div>
                <div className="text-xs font-bold tracking-widest uppercase opacity-80">Your Rank</div>
                <div className={`text-xl font-black ${meta.textClass}`}>{meta.label}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-black ${meta.textClass}`}>{rank.rank_points}</div>
              <div className="text-xs opacity-70">pts · #{myPos > 0 ? myPos : '—'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-400 font-semibold">{rank.wins}W</span>
            <span className="text-red-400 font-semibold">{rank.losses}L</span>
            {nxt && (
              <span className="text-muted-foreground">
                {nxt.minPoints - rank.rank_points} pts to {nxt.emoji} {nxt.label}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Tier legend */}
      <div className="flex flex-wrap gap-1.5">
        {RANK_TIERS.map((t) => (
          <RPGRankBadge key={t.tier} tier={t.tier} size="sm" />
        ))}
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b">
          <Trophy className="h-4 w-4 text-primary" />
          <div className="text-sm font-black tracking-widest uppercase">Season Leaderboard</div>
        </div>
        {loading ? (
          <div className="p-6 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading rankings…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No ranked players yet — win a PvP match to claim first place!
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y">
            {rows.map((r) => {
              const isMe = r.user_id === uid;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isMe ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                >
                  <div className={`w-8 text-center font-black ${r.position === 1 ? 'text-yellow-400' : r.position === 2 ? 'text-slate-300' : r.position === 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {r.position === 1 ? <Crown className="h-4 w-4 mx-auto" /> : `#${r.position}`}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-semibold truncate">{isMe ? 'You' : r.display_name}</div>
                    <div className="text-xs text-muted-foreground">{r.wins}W · {r.losses}L</div>
                  </div>
                  <RPGRankBadge tier={r.tier} size="sm" showLabel={false} />
                  <div className="w-16 text-right font-mono font-bold">{r.rank_points}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
