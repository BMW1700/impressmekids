import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useMyRank } from '@/hooks/useRPGRanks';
import { tierMeta } from '@/lib/rpgRanks';
import { RPGDailyHubPanel } from './RPGDailyHubPanel';

/**
 * Compact rank + daily-quest indicator for the game header.
 *
 * Existed only inside the Daily Hub before, which meant students never saw
 * how close they were to finishing a quest while actually playing. This chip
 * surfaces "2/3 quests" and the current rank tier at all times and opens the
 * full hub on tap. Read-only: it never writes quest or rank state.
 */
export const RPGQuestStatusChip = () => {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const { quests } = useDailyQuests();
  const { rank } = useMyRank();

  const done = useMemo(
    () => quests.filter((q) => q.completed_at !== null).length,
    [quests],
  );

  // Signed-out players have no quests or rank to show.
  if (!session) return null;

  const meta = tierMeta(rank?.tier ?? 'bronze');
  const allDone = quests.length > 0 && done === quests.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Daily quests: ${done} of ${quests.length} complete. Rank ${meta.label}. Open quest hub.`}
        className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold transition-colors hover:border-white/40 ${meta.bgClass} ${meta.textClass}`}
      >
        <span aria-hidden="true">{meta.emoji}</span>
        {quests.length > 0 && (
          <span className={allDone ? 'text-emerald-300' : undefined}>
            {done}/{quests.length}
          </span>
        )}
        {!allDone && quests.length > 0 && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"
          />
        )}
      </button>

      <RPGDailyHubPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};
