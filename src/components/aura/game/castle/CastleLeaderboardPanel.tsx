import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Loader2 } from "lucide-react";
import { useCastleLeaderboard, LeaderboardScope } from "@/hooks/useCastleLeaderboard";
import { useAuth } from "@/contexts/AuthContext";

export const CastleLeaderboardPanel = () => {
  const [scope, setScope] = useState<LeaderboardScope>("week");
  const { user } = useAuth();
  const { data, isLoading } = useCastleLeaderboard(scope, 10);
  const rows = data || [];

  return (
    <Card className="p-4 bg-slate-900/80 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-300" />
          <h3 className="text-white font-bold">Endless Siege Leaderboard</h3>
        </div>
        <div className="flex bg-slate-800 rounded-full p-0.5 text-[11px]">
          {(["week", "all_time"] as LeaderboardScope[]).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-2.5 py-1 rounded-full font-semibold ${scope === s ? "bg-amber-500 text-black" : "text-slate-300"}`}
            >
              {s === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-4">
          No runs yet. Be the first to set a record!
        </div>
      ) : (
        <ul className="space-y-1">
          {rows.map((r, i) => {
            const isMe = r.user_id === user?.id;
            return (
              <li
                key={r.user_id}
                className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm ${
                  isMe ? "bg-amber-500/15 border border-amber-500/40" : "bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-5 text-right font-bold ${i < 3 ? "text-amber-300" : "text-slate-400"}`}>
                    {i + 1}
                  </span>
                  <span className="truncate text-white">{r.display_name}{isMe && " (you)"}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-rose-300 font-bold">W{r.best_wave}</span>
                  <span className="text-slate-400 hidden sm:inline">{r.best_words} words</span>
                  <span className="text-slate-400">{Math.round(Number(r.best_accuracy))}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
