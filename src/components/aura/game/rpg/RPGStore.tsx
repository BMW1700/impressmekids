import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ShoppingBag, X, Coins, Lock, Check, Sparkles, Zap, Shield, Palette, Beaker, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STORE_ITEMS, RARITY_COLORS, type StoreItem } from "@/lib/gameEconomy";
import { useToast } from "@/hooks/use-toast";
import { SkinPreviewCard } from "./SkinPreviewCard";
import { getStoredTheme } from "@/lib/gameTheme";
import { usePlayerPets } from "@/hooks/usePlayerPets";
import { PetVisual } from "./PetVisual";

interface RPGStoreProps {
  isOpen: boolean;
  onClose: () => void;
  currentGold: number;
  ownedItems: string[];
  onPurchase: (item: StoreItem) => void;
  equippedSkins?: { [key: string]: string | undefined };
  onEquipSkin?: (itemId: string) => void;
  studentId?: string;
  gradeMode?: string;
}

const categoryIcons: Record<string, typeof ShoppingBag> = {
  power: Zap,
  skin: Palette,
  potion: Beaker,
  upgrade: Shield,
  pet: Heart,
};

const categoryLabels: Record<string, string> = {
  power: 'Powers',
  skin: 'Skins',
  potion: 'Potions',
  upgrade: 'Upgrades',
  pet: 'Pets',
};

export const RPGStore = ({
  isOpen,
  onClose,
  currentGold,
  ownedItems,
  onPurchase,
  equippedSkins = {},
  onEquipSkin,
  studentId,
  gradeMode,
}: RPGStoreProps) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('power');
  const theme = getStoredTheme();
  const isAgent = theme === 'agent';

  const { getAllPetsWithStatus, purchasePet, equipPet, equippedPet } = usePlayerPets(studentId, gradeMode);
  const petsWithStatus = studentId ? getAllPetsWithStatus() : [];

  // Filter items by theme: show theme-specific + shared (no theme tag = shared)
  const filteredItems = STORE_ITEMS.filter(item => {
    if (!item.theme) return true; // shared (potions, upgrades)
    if (item.theme === 'shared') return true;
    return item.theme === (isAgent ? 'agent' : 'classic');
  });

  const baseCategories = [...new Set(filteredItems.map(item => item.category))];
  const categories = studentId ? [...baseCategories, 'pet'] : baseCategories;

  const handlePurchase = (item: StoreItem) => {
    if (currentGold < item.price) {
      toast({
        title: "Not enough gold!",
        description: `You need ${item.price - currentGold} more gold to buy this.`,
        variant: "destructive",
      });
      return;
    }

    if (item.category !== 'potion' && ownedItems.includes(item.id)) {
      toast({
        title: "Already owned!",
        description: "You already have this item.",
      });
      return;
    }

    onPurchase(item);
  };

  const handleEquip = (item: StoreItem) => {
    if (onEquipSkin && item.category === 'skin') {
      onEquipSkin(item.id);
    }
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`bg-gradient-to-br ${isAgent ? 'from-slate-900 via-cyan-900/30 to-slate-900 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.3)]' : 'from-slate-900 via-amber-900/30 to-slate-900 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.3)]'} rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-hidden border flex flex-col`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <ShoppingBag className={`w-7 h-7 ${isAgent ? 'text-cyan-500' : 'text-amber-500'}`} />
                  {isAgent ? 'Field Requisitions' : 'Item Shop'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{currentGold.toLocaleString()} Gold</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-slate-800/50 border border-slate-700 p-1 mb-4">
                {categories.map((category) => {
                  const Icon = categoryIcons[category] || ShoppingBag;
                  return (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 flex items-center gap-1"
                    >
                      <Icon className="w-4 h-4" />
                      {categoryLabels[category] || category}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {categories.map((category) => (
                <TabsContent 
                  key={category} 
                  value={category} 
                  className="flex-1 overflow-y-auto pr-2 mt-0"
                >
                  {/* Special skin layout with character previews */}
                  {category === 'skin' ? (
                    <div className="grid grid-cols-3 gap-3">
                      {filteredItems.filter(item => item.category === 'skin').map((item) => {
                        const isOwned = ownedItems.includes(item.id);
                        const canAfford = currentGold >= item.price;
                        const isEquipped = item.skinVariant === equippedSkins[item.character || 'valor'];

                        return (
                          <div key={item.id} className="space-y-2">
                            <SkinPreviewCard
                              skinVariant={item.skinVariant || 'default'}
                              character={item.character || 'valor'}
                              name={item.name}
                              rarity={item.rarity}
                              isOwned={isOwned}
                              isEquipped={isEquipped}
                              onClick={() => isOwned ? handleEquip(item) : handlePurchase(item)}
                            />
                            {/* Price / Equip Button */}
                            {isOwned ? (
                              <Button
                                onClick={() => handleEquip(item)}
                                disabled={isEquipped}
                                size="sm"
                                className={`w-full ${isEquipped ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'}`}
                              >
                                {isEquipped ? <><Check className="w-3 h-3 mr-1" /> Equipped</> : 'Equip'}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handlePurchase(item)}
                                disabled={!canAfford}
                                size="sm"
                                className={`w-full ${
                                  canAfford
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                                    : 'bg-slate-700 cursor-not-allowed'
                                }`}
                              >
                                <Coins className="w-3 h-3 mr-1" />
                                {item.price.toLocaleString()}
                                {!canAfford && <Lock className="w-3 h-3 ml-1" />}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard item grid */
                    <div className="grid grid-cols-2 gap-3">
                      {filteredItems.filter(item => item.category === category).map((item) => {
                        const isOwned = item.category !== 'potion' && ownedItems.includes(item.id);
                        const canAfford = currentGold >= item.price;
                        const rarityStyle = RARITY_COLORS[item.rarity];

                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            className={`relative rounded-xl p-4 transition-all border-2 ${rarityStyle.border} ${
                              isOwned
                                ? 'bg-green-500/10'
                                : canAfford
                                ? `bg-gradient-to-br ${rarityStyle.bg}`
                                : 'bg-slate-800/30 opacity-60'
                            }`}
                          >
                            {/* Rarity glow for legendary */}
                            {item.rarity === 'legendary' && !isOwned && (
                              <motion.div
                                className="absolute inset-0 rounded-xl bg-amber-500/20 blur-sm"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}

                            {/* Item Icon */}
                            <div className="flex items-start gap-3 mb-3 relative z-10">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                                isOwned ? 'bg-green-500/20' : `bg-gradient-to-br ${rarityStyle.bg}`
                              }`}>
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate">{item.name}</h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                              </div>
                            </div>

                            {/* Rarity Badge */}
                            <div className={`text-xs font-bold uppercase mb-2 ${rarityStyle.text}`}>
                              {item.rarity}
                            </div>

                            {/* Effect */}
                            {item.value && (
                              <div className="text-sm text-amber-300 mb-3">
                                +{item.value} {item.effect}
                              </div>
                            )}

                            {/* Price / Buy Button */}
                            {isOwned ? (
                              <div className="flex items-center justify-center gap-2 bg-green-500/20 py-2 rounded-lg">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-bold">Owned</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handlePurchase(item)}
                                disabled={!canAfford}
                                className={`w-full ${
                                  canAfford
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                                    : 'bg-slate-700 cursor-not-allowed'
                                }`}
                              >
                                <Coins className="w-4 h-4 mr-1" />
                                {item.price.toLocaleString()}
                                {!canAfford && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </Button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Featured Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 bg-gradient-to-r ${isAgent ? 'from-cyan-500/20 via-teal-500/20 to-cyan-500/20 border-cyan-500/30' : 'from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30'} rounded-xl p-3 border`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className={`w-4 h-4 ${isAgent ? 'text-cyan-400' : 'text-purple-400'}`} />
                <span className={`text-sm ${isAgent ? 'text-cyan-300' : 'text-purple-300'}`}>
                  {isAgent ? 'Earn credits by completing missions and neutralizing threats!' : 'Earn gold by reading books and winning battles!'}
                </span>
                <Sparkles className={`w-4 h-4 ${isAgent ? 'text-cyan-400' : 'text-purple-400'}`} />
              </div>
            </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
