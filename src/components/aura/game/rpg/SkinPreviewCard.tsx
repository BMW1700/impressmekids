import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { SirValor } from "../characters/SirValor";
import { Elara } from "../characters/Elara";
import { PrincessElla } from "../characters/PrincessElla";
import { RARITY_COLORS, type ItemRarity, type SkinCharacter } from "@/lib/gameEconomy";

interface SkinPreviewCardProps {
  skinVariant: string;
  character: SkinCharacter;
  name: string;
  rarity: ItemRarity;
  isOwned: boolean;
  isEquipped?: boolean;
  onClick?: () => void;
}

export const SkinPreviewCard = ({
  skinVariant,
  character,
  name,
  rarity,
  isOwned,
  isEquipped = false,
  onClick,
}: SkinPreviewCardProps) => {
  const rarityStyle = RARITY_COLORS[rarity];

  const renderCharacter = () => {
    switch (character) {
      case 'valor':
        return (
          <SirValor
            state="idle"
            healthPercent={100}
            size="small"
            showHealthBar={false}
            skinVariant={skinVariant as any}
          />
        );
      case 'elara':
        return (
          <Elara
            state="idle"
            healthPercent={100}
            size="small"
            showHealthBar={false}
            skinVariant={skinVariant as any}
          />
        );
      case 'ella':
        return (
          <PrincessElla
            state="idle"
            healthPercent={100}
            size="small"
            showHealthBar={false}
            skinVariant={skinVariant as any}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl p-3 border-2 transition-all ${rarityStyle.border} bg-gradient-to-br ${rarityStyle.bg}`}
    >
      {/* Rarity glow effect */}
      {(rarity === 'legendary' || rarity === 'epic') && (
        <motion.div
          className={`absolute inset-0 rounded-xl opacity-30 blur-md ${
            rarity === 'legendary' ? 'bg-amber-500' : 'bg-purple-500'
          }`}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Character preview */}
      <div className="relative flex justify-center items-center h-24 mb-2">
        {renderCharacter()}
      </div>

      {/* Name and rarity */}
      <div className="text-center">
        <p className="text-sm font-bold text-white truncate">{name}</p>
        <p className={`text-xs font-medium uppercase ${rarityStyle.text}`}>
          {rarity}
        </p>
      </div>

      {/* Owned / Equipped badge */}
      {isOwned && (
        <div className="absolute top-2 right-2">
          {isEquipped ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500 rounded-full p-1"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          ) : (
            <div className="bg-slate-700/80 rounded-full p-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
          )}
        </div>
      )}

      {/* Legendary particles */}
      {rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                y: [-20, 20],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
