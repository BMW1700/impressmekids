import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Star, Flame, Trophy, Heart, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyRewards } from "@/hooks/useDailyRewards";
import { usePlayerAchievements } from "@/hooks/usePlayerAchievements";
import { usePlayerPets } from "@/hooks/usePlayerPets";
import { usePlayerInventory } from "@/hooks/usePlayerInventory";
import { DailyRewardCalendar } from "./DailyRewardCalendar";
import { AchievementShowcase } from "./AchievementShowcase";
import { PetCompanionPanel } from "./PetCompanionPanel";
import { RPGStore } from "./RPGStore";
import { getStoredTheme } from "@/lib/gameTheme";

interface RPGPlayerHUDProps {
  studentId: string;
  gold: number;
  xp: number;
  className?: string;
  gradeMode?: string;
}

export const RPGPlayerHUD = ({ 
  studentId, 
  gold, 
  xp, 
  className = "",
  gradeMode,
}: RPGPlayerHUDProps) => {
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [showStore, setShowStore] = useState(false);

  const { hasClaimedToday, currentStreak } = useDailyRewards(studentId);
  const { getTotalStats } = usePlayerAchievements(studentId);
  const { equippedPet, equippedPetData } = usePlayerPets(studentId, gradeMode);
  const { ownedItems, purchaseItem, equipSkin, getEquippedSkin } = usePlayerInventory(studentId, gradeMode);

  const achievementStats = getTotalStats();
  const theme = getStoredTheme();
  const isAgent = theme === 'agent';

  // Get equipped skins for character previews
  const equippedSkins = isAgent
    ? {
        agent_x: getEquippedSkin('agent_x') || undefined,
        cipher: getEquippedSkin('cipher') || undefined,
        shadow: getEquippedSkin('shadow') || undefined,
      }
    : {
        valor: getEquippedSkin('valor') || undefined,
        elara: getEquippedSkin('elara') || undefined,
        ella: getEquippedSkin('ella') || undefined,
      };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Gold Display. The counter is always visible (watching gold climb is
            the motivation), but the Shop itself only opens once the student has
            cleared a few levels — otherwise a new player browses an empty store
            they can't afford instead of fighting. */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => {
              if (!storeUnlocked) return;
              markUnlockSeen('store');
              setShowStore(true);
            }}
            aria-disabled={!storeUnlocked}
            title={storeUnlocked ? 'Open the Shop' : 'Win 3 battles to unlock the Shop'}
            variant="ghost"
            size="sm"
            className="relative flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-full px-3 py-1.5"
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-400">{gold.toLocaleString()}</span>
            {storeUnlocked && <ShoppingBag className="w-3 h-3 text-yellow-400/70" />}
            {storeJustUnlocked && (
              <motion.span
                className="absolute -top-2 -right-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black text-slate-900"
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                NEW!
              </motion.span>
            )}
          </Button>
        </motion.div>


        {/* XP Display */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-full px-3 py-1.5"
        >
          <Star className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-purple-400">{xp.toLocaleString()}</span>
        </motion.div>

        {/* Streak Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setShowDailyRewards(true)}
            variant="ghost"
            size="sm"
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
              !hasClaimedToday
                ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-2 border-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-orange-400">{currentStreak}</span>
            
            {!hasClaimedToday && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
              >
                <Gift className="w-2.5 h-2.5 text-white" />
              </motion.div>
            )}
          </Button>
        </motion.div>

        {/* Achievements Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setShowAchievements(true)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full px-3 py-1.5"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-indigo-300">{achievementStats.unlocked}</span>
          </Button>
        </motion.div>

        {/* Pet Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setShowPets(true)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-full px-3 py-1.5"
          >
            {equippedPetData ? (
              <span className="text-lg leading-none">{equippedPetData.emoji}</span>
            ) : (
              <Heart className="w-4 h-4 text-pink-400" />
            )}
            {equippedPet && (
              <span className="text-xs font-bold text-pink-300">Lv.{equippedPet.level}</span>
            )}
          </Button>
        </motion.div>
      </div>

      {/* Modals */}
      <DailyRewardCalendar
        studentId={studentId}
        isOpen={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
      />
      
      <AchievementShowcase
        studentId={studentId}
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
      
      <PetCompanionPanel
        studentId={studentId}
        isOpen={showPets}
        onClose={() => setShowPets(false)}
        currentGold={gold}
        gradeMode={gradeMode}
      />

      <RPGStore
        isOpen={showStore}
        onClose={() => setShowStore(false)}
        currentGold={gold}
        ownedItems={ownedItems}
        equippedSkins={equippedSkins}
        studentId={studentId}
        gradeMode={gradeMode}
        onPurchase={(item) => {
          purchaseItem.mutate({ item, currentGold: gold });
        }}
        onEquipSkin={(itemId) => {
          equipSkin.mutate(itemId);
        }}
      />
    </>
  );
};
