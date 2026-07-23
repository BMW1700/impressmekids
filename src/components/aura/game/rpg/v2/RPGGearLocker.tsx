import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Backpack, X, Check } from "lucide-react";
import { usePlayerLoot } from "@/hooks/usePlayerLoot";
import type { LootItem, LootSlot } from "@/lib/rpgLootCatalog";
import { rarityColors, rarityLabel, slotEmoji, slotLabel, sumEquippedStats } from "@/lib/rpgLootCatalog";

interface RPGGearLockerProps {
  open: boolean;
  onClose: () => void;
}

const SLOT_ORDER: LootSlot[] = ["weapon", "armor", "trinket"];

/** Gear locker overlay: shows all owned loot, lets player equip one item per slot. */
export const RPGGearLocker = ({ open, onClose }: RPGGearLockerProps) => {
  const { items, loading, setEquipped } = usePlayerLoot();
  const [activeSlot, setActiveSlot] = useState<LootSlot>("weapon");
  const equipped = items.filter((i) => i.equipped);
  const totals = sumEquippedStats(items);
  const slotItems = items.filter((i) => i.slot === activeSlot);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.96 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 rounded-full bg-slate-800 hover:bg-slate-700 p-1.5 text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Backpack className="h-6 w-6 text-amber-400" />
              <h2 className="text-2xl font-black text-white">Gear Locker</h2>
            </div>

            {/* Equipped summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {SLOT_ORDER.map((slot) => {
                const eq = equipped.find((i) => i.slot === slot);
                return (
                  <button
                    key={slot}
                    onClick={() => setActiveSlot(slot)}
                    className={`rounded-lg border-2 p-3 text-left transition ${
                      activeSlot === slot ? "border-amber-400 bg-amber-500/10" : "border-slate-700 bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400 mb-1">
                      {slotEmoji(slot)} {slotLabel(slot)}
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {eq ? eq.name : <span className="text-slate-500 font-normal">— empty —</span>}
                    </div>
                    {eq && (
                      <div className={`text-[11px] mt-0.5 ${rarityColors(eq.rarity).text}`}>
                        {rarityLabel(eq.rarity)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Totals bar */}
            <div className="grid grid-cols-3 gap-2 mb-5 rounded-lg bg-black/40 p-3 text-center">
              <div>
                <div className="text-red-400 text-xs">❤️ Bonus HP</div>
                <div className="text-white font-bold">+{totals.hp}</div>
              </div>
              <div>
                <div className="text-orange-400 text-xs">⚔️ Bonus ATK</div>
                <div className="text-white font-bold">+{totals.attack}</div>
              </div>
              <div>
                <div className="text-cyan-400 text-xs">✨ MP/s</div>
                <div className="text-white font-bold">+{totals.mp_regen}</div>
              </div>
            </div>

            {/* Item grid for active slot */}
            <div className="space-y-2">
              {loading && <p className="text-slate-400 text-sm text-center py-8">Loading gear…</p>}
              {!loading && slotItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No {slotLabel(activeSlot).toLowerCase()}s yet.
                  <br />
                  <span className="text-slate-500 text-xs">Beat bosses to unlock loot drops.</span>
                </div>
              )}
              {slotItems.map((it) => (
                <LootRow key={it.id} item={it} onToggle={() => void setEquipped(it.id, !it.equipped)} />
              ))}
            </div>

            <Button onClick={onClose} className="w-full mt-5 bg-slate-700 hover:bg-slate-600 text-white font-bold">
              Done
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function LootRow({ item, onToggle }: { item: LootItem; onToggle: () => void }) {
  const c = rarityColors(item.rarity);
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 rounded-lg border ${c.border} ${c.bg} p-3 text-left hover:brightness-110 transition`}
    >
      <div className="text-3xl">{item.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold ${c.text} truncate`}>{item.name}</div>
        <div className="text-xs text-slate-400">
          {rarityLabel(item.rarity)} · +{item.stats.hp ?? 0} HP · +{item.stats.attack ?? 0} ATK
        </div>
      </div>
      {item.equipped ? (
        <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-1 text-xs font-bold">
          <Check className="h-3 w-3" /> Equipped
        </div>
      ) : (
        <div className="text-xs font-bold text-slate-300 bg-slate-700/70 rounded-full px-2.5 py-1">
          Equip
        </div>
      )}
    </button>
  );
}
