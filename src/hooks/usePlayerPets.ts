import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PETS, getPetById, calculatePetBonus, canLevelUp, Pet } from "@/lib/petsData";

interface PlayerPet {
  id: string;
  student_id: string;
  pet_type: string;
  pet_name: string | null;
  level: number;
  experience: number;
  is_equipped: boolean;
  last_fed_at: string | null;
  unlocked_at: string;
  grade_mode: string;
}

const normalizeGradeMode = (gm?: string): string => (gm === '6to12' ? '6to12' : 'k5');

export const usePlayerPets = (studentId?: string, gradeMode?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gm = normalizeGradeMode(gradeMode);

  const { data: ownedPets = [], isLoading } = useQuery({
    queryKey: ["player-pets", studentId, gm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_pets")
        .select("*")
        .eq("student_id", studentId!)
        .eq("grade_mode", gm)
        .order("unlocked_at", { ascending: true });
      if (error) throw error;
      return data as PlayerPet[];
    },
    enabled: !!studentId,
  });

  const equippedPet = ownedPets.find(p => p.is_equipped);
  const equippedPetData = equippedPet ? getPetById(equippedPet.pet_type) : undefined;

  const isPetOwned = (petId: string): boolean => ownedPets.some(p => p.pet_type === petId);

  const getAllPetsWithStatus = () => {
    return PETS.map(pet => {
      const owned = ownedPets.find(p => p.pet_type === pet.id);
      return {
        ...pet,
        isOwned: !!owned,
        playerData: owned,
        currentBonus: owned ? calculatePetBonus(pet, owned.level) : 0,
      };
    });
  };

  // Deduct gold helper — scoped to active grade mode
  const deductGold = async (currentGold: number, amount: number) => {
    if (!studentId) throw new Error("No student ID");
    if (currentGold < amount) throw new Error("Not enough gold");
    const { error } = await supabase
      .from("campaign_progress")
      .update({ total_gold: currentGold - amount })
      .eq("student_id", studentId)
      .eq("grade_mode", gm);
    if (error) throw error;
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["player-pets", studentId, gm] });
    queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId, gm] });
    queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
  };

  // Purchase pet — charges gold from active grade-mode wallet
  const purchasePet = useMutation({
    mutationFn: async ({ petId, currentGold, customName }: { petId: string; currentGold: number; customName?: string }) => {
      if (!studentId) throw new Error("No student ID");
      const pet = getPetById(petId);
      if (!pet) throw new Error("Pet not found");
      if (isPetOwned(petId)) throw new Error("Pet already owned");
      if (currentGold < pet.price) throw new Error(`Need ${pet.price - currentGold} more gold`);

      await deductGold(currentGold, pet.price);

      const { data, error } = await supabase
        .from("player_pets")
        .insert({
          student_id: studentId,
          pet_type: petId,
          pet_name: customName || null,
          is_equipped: ownedPets.length === 0,
          grade_mode: gm,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return { pet, record: data };
    },
    onSuccess: (result) => {
      invalidateAll();
      toast({
        title: `🎉 ${result.pet.emoji} ${result.pet.name} Joined Your Party!`,
        description: result.pet.baseBonus.label,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
  });

  const equipPet = useMutation({
    mutationFn: async (petId: string) => {
      if (!studentId) throw new Error("No student ID");
      // Only unequip pets within the same grade mode
      await supabase
        .from("player_pets")
        .update({ is_equipped: false })
        .eq("student_id", studentId)
        .eq("grade_mode", gm);
      const { error } = await supabase
        .from("player_pets")
        .update({ is_equipped: true })
        .eq("student_id", studentId)
        .eq("grade_mode", gm)
        .eq("pet_type", petId);
      if (error) throw error;
      return getPetById(petId);
    },
    onSuccess: (pet) => {
      invalidateAll();
      if (pet) toast({ title: `${pet.emoji} ${pet.name} Equipped!`, description: pet.baseBonus.label });
    },
  });

  // Feed a pet — actually charges gold now
  const feedPet = useMutation({
    mutationFn: async ({ petId, currentGold }: { petId: string; currentGold: number }) => {
      if (!studentId) throw new Error("No student ID");
      const pet = getPetById(petId);
      const playerPet = ownedPets.find(p => p.pet_type === petId);
      if (!pet || !playerPet) throw new Error("Pet not found");
      if (currentGold < pet.feedCost) throw new Error(`Need ${pet.feedCost - currentGold} more gold`);

      await deductGold(currentGold, pet.feedCost);

      const xpGain = 20;
      const newXp = playerPet.experience + xpGain;
      const shouldLevelUp = canLevelUp(pet, playerPet.level, newXp);
      const newLevel = shouldLevelUp ? playerPet.level + 1 : playerPet.level;
      const remainingXp = shouldLevelUp ? newXp - (playerPet.level * pet.xpPerLevel) : newXp;

      const { error } = await supabase
        .from("player_pets")
        .update({ experience: remainingXp, level: newLevel, last_fed_at: new Date().toISOString() })
        .eq("id", playerPet.id);
      if (error) throw error;
      return { pet, leveledUp: shouldLevelUp, newLevel };
    },
    onSuccess: (result) => {
      invalidateAll();
      if (result.leveledUp) {
        toast({ title: `🎉 ${result.pet.emoji} Leveled Up!`, description: `Now level ${result.newLevel}!` });
      } else {
        toast({ title: `${result.pet.emoji} Fed!`, description: "+20 XP gained!" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Cannot Feed", description: error.message, variant: "destructive" });
    },
  });

  const renamePet = useMutation({
    mutationFn: async ({ petId, newName }: { petId: string; newName: string }) => {
      if (!studentId) throw new Error("No student ID");
      const { error } = await supabase
        .from("player_pets")
        .update({ pet_name: newName })
        .eq("student_id", studentId)
        .eq("grade_mode", gm)
        .eq("pet_type", petId);
      if (error) throw error;
      return newName;
    },
    onSuccess: (newName) => {
      invalidateAll();
      toast({ title: "Pet Renamed!", description: `Your pet is now called ${newName}` });
    },
  });

  const getActiveBonus = () => {
    if (!equippedPet || !equippedPetData) return null;
    return {
      type: equippedPetData.baseBonus.type,
      value: calculatePetBonus(equippedPetData, equippedPet.level),
      label: equippedPetData.baseBonus.label,
      petName: equippedPet.pet_name || equippedPetData.name,
      petEmoji: equippedPetData.emoji,
    };
  };

  return {
    ownedPets,
    isLoading,
    equippedPet,
    equippedPetData,
    isPetOwned,
    getAllPetsWithStatus,
    purchasePet: purchasePet.mutate,
    purchasePetMutation: purchasePet,
    equipPet: equipPet.mutate,
    equipPetMutation: equipPet,
    feedPet: feedPet.mutate,
    feedPetMutation: feedPet,
    renamePet: renamePet.mutate,
    getActiveBonus,
  };
};
