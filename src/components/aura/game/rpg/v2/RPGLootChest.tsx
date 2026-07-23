import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import type { RolledLoot } from "@/hooks/usePlayerLoot";
import {
  rarityColors,
  rarityLabel,
  resolveLootEmoji,
  resolveLootFlavor,
  resolveLootName,
  slotLabel,
} from "@/lib/rpgLootCatalog";

interface RPGLootChestProps {
  loot: RolledLoot | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Post-boss loot chest reveal.
 * Two-stage: shaking chest → burst → item card.
 */
export const RPGLootChest = ({ loot, open, onClose }: RPGLootChestProps) => {
  const [stage, setStage] = useState<"chest" | "burst" | "reveal">("chest");

  useEffect(() => {
    if (!open || !loot) return;
    setStage("chest");
    const t1 = setTimeout(() => setStage("burst"), 1200);
    const t2 = setTimeout(() => setStage("reveal"), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, loot]);

  if (!loot) return null;
  const colors = rarityColors(loot.rarity);
  const isLegendary = loot.rarity === "legendary";
  const isRare = loot.rarity === "rare";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          {/* Legendary/rare screen flash */}
          {(isLegendary || isRare) && stage === "burst" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 }}
              className={`absolute inset-0 ${isLegendary ? "bg-amber-300/70" : "bg-sky-300/50"} pointer-events-none`}
            />
          )}

          {/* Confetti sparkles for legendaries */}
          {isLegendary && stage === "reveal" &&
            Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 600,
                  opacity: 0,
                  scale: 1.2,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1.6 + Math.random(), ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-sm bg-amber-300"
              />
            ))}

          <div className="relative w-full max-w-md">
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-20 rounded-full bg-slate-800 hover:bg-slate-700 p-1.5 text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {stage === "chest" && (
              <motion.div
                className="flex flex-col items-center justify-center py-16"
                animate={{ rotate: [-3, 3, -3, 3, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <div className="text-8xl drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]">🎁</div>
                <p className="mt-4 text-amber-200 font-bold text-lg tracking-wide">
                  A boss dropped something…
                </p>
              </motion.div>
            )}

            {stage === "reveal" && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 shadow-2xl ${colors.glow} ring-4 ${colors.ring}`}
              >
                {isLegendary && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 via-transparent to-orange-400/20 pointer-events-none"
                  />
                )}

                <div className="text-center relative">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${colors.text} bg-black/40 mb-4`}>
                    {isLegendary && <Sparkles className="h-3 w-3" />}
                    {rarityLabel(loot.rarity)}
                    {isLegendary && <Sparkles className="h-3 w-3" />}
                  </div>

                  <motion.div
                    animate={isLegendary ? { rotate: [0, -5, 5, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-7xl mb-3 drop-shadow-lg"
                  >
                    {resolveLootEmoji(loot.item_id)}
                  </motion.div>

                  <h3 className={`text-2xl font-black ${colors.text} mb-1`}>
                    {resolveLootName(loot.item_id)}
                  </h3>
                  <p className="text-slate-300 text-xs uppercase tracking-wider mb-3">
                    {slotLabel(loot.slot)}
                  </p>
                  <p className="text-slate-400 text-sm italic mb-4 px-2">
                    "{resolveLootFlavor(loot.item_id)}"
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                    <div className="bg-black/40 rounded-lg py-2">
                      <div className="text-red-400 text-xs">❤️ HP</div>
                      <div className="text-white font-bold">+{loot.stats.hp ?? 0}</div>
                    </div>
                    <div className="bg-black/40 rounded-lg py-2">
                      <div className="text-orange-400 text-xs">⚔️ ATK</div>
                      <div className="text-white font-bold">+{loot.stats.attack ?? 0}</div>
                    </div>
                    <div className="bg-black/40 rounded-lg py-2">
                      <div className="text-cyan-400 text-xs">✨ MP/s</div>
                      <div className="text-white font-bold">+{loot.stats.mp_regen ?? 0}</div>
                    </div>
                  </div>

                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold"
                  >
                    Add to Inventory
                  </Button>
                  <p className="text-slate-500 text-[11px] mt-2">
                    Equip it from the Gear Locker before your next battle.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
