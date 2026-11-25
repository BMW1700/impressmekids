import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, RotateCcw, Play, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignWorld } from "@/lib/campaignData";
import { buildPreKSections, preKTileStatus, type PreKTileStatus } from "@/lib/preKLevelMap";
import { usePreKLevelStars } from "@/hooks/usePreKLevelStars";
import type { GradeMode } from "@/lib/gameTheme";

interface Props {
  worlds: CampaignWorld[] | null;
  userId?: string;
  gradeMode?: string;
  onOpen: (world: CampaignWorld) => void;
}

interface Tile { world: CampaignWorld; levelNumber: number; title: string; goal: string }

const tileClass: Record<PreKTileStatus, string> = {
  passed: "prek-tile prek-tile--passed",
  retry: "prek-tile prek-tile--retry",
  new: "prek-tile prek-tile--new",
};

export function PreKLevelGrid({ worlds, userId, gradeMode = "k5", onOpen }: Props) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const stars = usePreKLevelStars(userId, gradeMode as GradeMode);

  const { data: meta } = useQuery({
    queryKey: ["prek-map-level-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prek_levels")
        .select("level_number, title, goal, prek_worlds!inner(world_number)")
        .eq("is_published", true);
      const m = new Map<string, { title: string; goal: string }>();
      for (const r of (data ?? []) as any[]) m.set(`${r.prek_worlds.world_number}:${r.level_number}`, { title: r.title, goal: r.goal ?? "" });
      return m;
    },
    staleTime: 60_000,
  });

  const { data: attempted } = useQuery({
    queryKey: ["prek-level-attempts", userId, gradeMode],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("prek_level_attempts")
        .select("world_number, level_number")
        .eq("user_id", userId!)
        .eq("grade_mode", gradeMode);
      return new Set((data ?? []).map((r) => `${r.world_number}:${r.level_number}`));
    },
    staleTime: 30_000,
  });

  const tiles: Tile[] = useMemo(() => {
    const out: Tile[] = [];
    for (const w of worlds ?? []) {
      for (const lv of w.levels ?? []) {
        const m = meta?.get(`${w.id}:${lv.id}`);
        out.push({ world: w, levelNumber: lv.id, title: m?.title || w.name, goal: m?.goal || w.description });
      }
    }
    return out;
  }, [worlds, meta]);

  const sections = useMemo(() => buildPreKSections(tiles), [tiles]);
  useEffect(() => { if (sectionIdx >= sections.length) setSectionIdx(0); }, [sections.length, sectionIdx]);
  const section = sections[sectionIdx];

  const statusOf = (t: Tile) =>
    preKTileStatus(stars.starsFor(t.world.id, t.levelNumber), attempted?.has(`${t.world.id}:${t.levelNumber}`) ?? false);
  const passedCount = section ? section.levels.filter((t) => statusOf(t) === "passed").length : 0;
  const total = section?.levels.length ?? 0;

  if (worlds === null) {
    return <div className="prek-map-panel p-10 text-center text-primary-foreground/80">Loading levels…</div>;
  }

  return (
    <div className="space-y-4">
      {sections.length > 1 && (
        <div className="prek-map-bar flex flex-wrap gap-2 p-2">
          {sections.map((s) => (
            <button
              key={s.index}
              onClick={() => setSectionIdx(s.index)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${s.index === sectionIdx ? "bg-primary text-primary-foreground" : "text-primary-foreground/80 hover:bg-primary/30"}`}
            >
              Section {s.index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="prek-map-panel p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="prek-map-badge h-12 w-12 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground leading-tight">
                Pre-K · {section?.name ?? "Level Map"}
              </h2>
              <p className="text-sm text-primary-foreground/75">
                {total} levels · Build early learning skills with Benny!
              </p>
            </div>
          </div>
          <div className="prek-map-progress rounded-2xl px-4 py-2 sm:w-56">
            <div className="flex justify-between text-xs text-primary-foreground/80 mb-1">
              <span>Section progress</span><span>{passedCount} / {total}</span>
            </div>
            <div className="h-2.5 rounded-full bg-background/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full prek-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: total ? `${(passedCount / total) * 100}%` : 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {total === 0 ? (
          <p className="text-center text-primary-foreground/80 py-10">New levels are coming soon!</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {section!.levels.map((t, i) => {
              const n = section!.firstNumber + i;
              const status = statusOf(t);
              return (
                <div key={`${t.world.id}:${t.levelNumber}`} className="relative">
                  <motion.button
                    type="button"
                    onClick={() => onOpen(t.world)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered((h) => (h === n ? null : h))}
                    onFocus={() => setHovered(n)}
                    onBlur={() => setHovered(null)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    aria-label={`Level ${n}: ${t.title}${status === "passed" ? ", passed" : status === "retry" ? ", try again" : ""}`}
                    className={`${tileClass[status]} w-full aspect-[16/10] rounded-2xl flex flex-col items-center justify-center`}
                  >
                    <span className="text-xs sm:text-sm font-semibold opacity-90">Level</span>
                    <span className="text-3xl sm:text-4xl font-extrabold leading-none">{n}</span>
                    {status === "passed" && (
                      <span className="prek-tile-badge prek-tile-badge--passed"><Check className="h-4 w-4" strokeWidth={3} /></span>
                    )}
                    {status === "retry" && (
                      <span className="prek-tile-badge prek-tile-badge--retry"><RotateCcw className="h-3.5 w-3.5" strokeWidth={3} /></span>
                    )}
                  </motion.button>
                  <AnimatePresence>
                    {hovered === n && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="hidden md:block absolute left-1/2 top-[85%] z-20 w-60 -translate-x-1/4 rounded-2xl bg-card text-card-foreground shadow-xl p-3 pointer-events-none"
                      >
                        <p className="font-bold text-sm lowercase first-letter:uppercase">Level {n} — {t.title}</p>
                        {t.goal && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.goal}</p>}
                        <p className="text-xs font-semibold text-primary mt-1.5 flex items-center gap-1">
                          <Play className="h-3 w-3 fill-current" /> {status === "retry" ? "Try again!" : status === "passed" ? "Play again" : "Tap to open"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-primary-foreground/85">
          <span className="flex items-center gap-1.5"><span className="prek-tile-badge prek-tile-badge--passed static"><Check className="h-3 w-3" strokeWidth={3} /></span> Passed</span>
          <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded-full prek-tile--new" /> Not yet played</span>
          <span className="flex items-center gap-1.5"><span className="prek-tile-badge prek-tile-badge--retry static"><RotateCcw className="h-3 w-3" strokeWidth={3} /></span> Try again</span>
        </div>
      </div>
    </div>
  );
}
