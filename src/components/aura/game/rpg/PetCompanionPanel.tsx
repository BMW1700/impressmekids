import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Coins, Star, Lock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { usePlayerPets } from "@/hooks/usePlayerPets";
import { PETS, getRarityGlow, getXpToNextLevel, calculatePetBonus } from "@/lib/petsData";

interface PetCompanionPanelProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  currentGold?: number;
}

export const PetCompanionPanel = ({ studentId, isOpen, onClose, currentGold = 0 }: PetCompanionPanelProps) => {
  const {
    ownedPets,
    equippedPet,
    getAllPetsWithStatus,
    equipPet,
    feedPet,
    renamePet,
    isLoading,
  } = usePlayerPets(studentId);

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");

  const petsWithStatus = getAllPetsWithStatus();
  const selectedPet = petsWithStatus.find(p => p.id === selectedPetId);

  const handleFeed = () => {
    if (!selectedPet || !selectedPet.playerData) return;
    if (currentGold < selectedPet.feedCost) return;
    feedPet({ petId: selectedPet.id, goldCost: selectedPet.feedCost });
  };

  const handleRename = () => {
    if (!selectedPet || !newName.trim()) return;
    renamePet({ petId: selectedPet.id, newName: newName.trim() });
    setIsRenaming(false);
    setNewName("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-gradient-to-br from-slate-900 via-pink-900/30 to-slate-900 rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-hidden border border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Heart className="w-7 h-7 text-pink-500" />
                  Pet Companions
                </h2>
                <p className="text-sm text-pink-300">
                  {ownedPets.length} / {PETS.length} pets collected
                </p>
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

            {/* Currently Equipped Pet */}
            {equippedPet && (
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-4 mb-4 border border-pink-500/30">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{petsWithStatus.find(p => p.id === equippedPet.pet_type)?.emoji}</div>
                  <div className="flex-1">
                    <div className="text-sm text-pink-300">Equipped Companion</div>
                    <div className="text-lg font-bold text-white">
                      {equippedPet.pet_name || petsWithStatus.find(p => p.id === equippedPet.pet_type)?.name}
                    </div>
                    <div className="text-sm text-green-400">
                      {petsWithStatus.find(p => p.id === equippedPet.pet_type)?.baseBonus.label}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">Lv.{equippedPet.level}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pet Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-3 gap-3">
                {petsWithStatus.map((pet) => {
                  const isOwned = pet.isOwned;
                  const isEquipped = equippedPet?.pet_type === pet.id;
                  const isSelected = selectedPetId === pet.id;

                  return (
                    <motion.button
                      key={pet.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => isOwned ? setSelectedPetId(isSelected ? null : pet.id) : null}
                      className={`relative rounded-xl p-3 text-center transition-all ${
                        isOwned
                          ? `bg-gradient-to-br ${pet.gradient} bg-opacity-20 border-2 ${isSelected ? 'border-white' : 'border-white/30'} ${getRarityGlow(pet.rarity)}`
                          : 'bg-slate-800/50 border border-slate-700/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Pet Emoji */}
                      <div className={`text-4xl mb-1 ${!isOwned ? 'grayscale' : ''}`}>
                        {isOwned ? pet.emoji : '❓'}
                      </div>

                      {/* Pet Name */}
                      <div className={`text-sm font-bold truncate ${isOwned ? 'text-white' : 'text-slate-500'}`}>
                        {isOwned ? (pet.playerData?.pet_name || pet.name) : '???'}
                      </div>

                      {/* Level */}
                      {isOwned && pet.playerData && (
                        <div className="text-xs text-white/70">Lv.{pet.playerData.level}</div>
                      )}

                      {/* Lock Icon */}
                      {!isOwned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-slate-500" />
                        </div>
                      )}

                      {/* Equipped Badge */}
                      {isEquipped && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Unlock Hint */}
                      {!isOwned && pet.unlockCondition.type === 'world' && (
                        <div className="absolute bottom-1 left-1 right-1 text-xs text-slate-400 bg-slate-800/80 rounded px-1">
                          World {pet.unlockCondition.value}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Selected Pet Details */}
            <AnimatePresence>
              {selectedPet && selectedPet.playerData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{selectedPet.emoji}</div>
                    <div className="flex-1">
                      {isRenaming ? (
                        <div className="flex gap-2">
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new name"
                            className="h-8 bg-slate-700 border-slate-600"
                            maxLength={20}
                          />
                          <Button size="sm" onClick={handleRename} className="h-8">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsRenaming(false)} className="h-8">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-white">
                            {selectedPet.playerData.pet_name || selectedPet.name}
                          </h3>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { setIsRenaming(true); setNewName(selectedPet.playerData?.pet_name || selectedPet.name); }}
                            className="h-6 text-xs text-slate-400 hover:text-white"
                          >
                            Rename
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-400 mt-1">{selectedPet.description}</p>
                      
                      {/* Level Progress */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Level {selectedPet.playerData.level}</span>
                          <span className="text-purple-400">
                            {selectedPet.playerData.experience} / {selectedPet.playerData.level * selectedPet.xpPerLevel} XP
                          </span>
                        </div>
                        <Progress 
                          value={(selectedPet.playerData.experience / (selectedPet.playerData.level * selectedPet.xpPerLevel)) * 100} 
                          className="h-2 bg-slate-700"
                        />
                      </div>

                      {/* Bonus */}
                      <div className="mt-2 text-sm text-green-400">
                        Current bonus: +{calculatePetBonus(selectedPet, selectedPet.playerData.level)}% {selectedPet.baseBonus.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => equipPet(selectedPet.id)}
                      disabled={equippedPet?.pet_type === selectedPet.id}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400"
                    >
                      {equippedPet?.pet_type === selectedPet.id ? 'Equipped' : 'Equip Pet'}
                    </Button>
                    <Button
                      onClick={handleFeed}
                      disabled={currentGold < selectedPet.feedCost}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    >
                      <Coins className="w-4 h-4 mr-1" />
                      Feed ({selectedPet.feedCost}g)
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
