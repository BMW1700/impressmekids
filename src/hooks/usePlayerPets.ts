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
}

export const usePlayerPets = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all owned pets
  const { data: ownedPets = [], isLoading } = useQuery({
    queryKey: ["player-pets", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_pets")
        .select("*")
        .eq("student_id", studentId!)
        .order("unlocked_at", { ascending: true });

      if (error) throw error;
      return data as PlayerPet[];
    },
    enabled: !!studentId,
  });

  // Get the currently equipped pet
  const equippedPet = ownedPets.find(p => p.is_equipped);
  const equippedPetData = equippedPet ? getPetById(equippedPet.pet_type) : undefined;

  // Check if a pet is owned
  const isPetOwned = (petId: string): boolean => {
    return ownedPets.some(p => p.pet_type === petId);
  };

  // Get all pets with ownership status
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

  // Unlock a new pet
  const unlockPet = useMutation({
    mutationFn: async ({ petId, customName }: { petId: string; customName?: string }) => {
      if (!studentId) throw new Error("No student ID");
      
      const pet = getPetById(petId);
      if (!pet) throw new Error("Pet not found");
      
      if (isPetOwned(petId)) {
        throw new Error("Pet already owned");
      }

      const { data, error } = await supabase
        .from("player_pets")
        .insert({
          student_id: studentId,
          pet_type: petId,
          pet_name: customName || null,
          is_equipped: ownedPets.length === 0, // Auto-equip if first pet
        })
        .select()
        .single();

      if (error) throw error;
      return { pet, record: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["player-pets", studentId] });
      
      toast({
        title: `🎉 New Pet Unlocked!`,
        description: `${result.pet.emoji} ${result.pet.name} has joined your adventure!`,
      });
    },
  });

  // Equip a pet
  const equipPet = useMutation({
    mutationFn: async (petId: string) => {
      if (!studentId) throw new Error("No student ID");
      
      // Unequip all pets first
      await supabase
        .from("player_pets")
        .update({ is_equipped: false })
        .eq("student_id", studentId);

      // Equip the selected pet
      const { error } = await supabase
        .from("player_pets")
        .update({ is_equipped: true })
        .eq("student_id", studentId)
        .eq("pet_type", petId);

      if (error) throw error;
      
      return getPetById(petId);
    },
    onSuccess: (pet) => {
      queryClient.invalidateQueries({ queryKey: ["player-pets", studentId] });
      
      if (pet) {
        toast({
          title: `${pet.emoji} ${pet.name} Equipped!`,
          description: pet.baseBonus.label,
        });
      }
    },
  });

  // Feed a pet (gain XP)
  const feedPet = useMutation({
    mutationFn: async ({ petId, goldCost }: { petId: string; goldCost: number }) => {
      if (!studentId) throw new Error("No student ID");
      
      const pet = getPetById(petId);
      const playerPet = ownedPets.find(p => p.pet_type === petId);
      
      if (!pet || !playerPet) throw new Error("Pet not found");

      // Add XP (each feed gives 20 XP)
      const xpGain = 20;
      const newXp = playerPet.experience + xpGain;
      const shouldLevelUp = canLevelUp(pet, playerPet.level, newXp);
      
      const newLevel = shouldLevelUp ? playerPet.level + 1 : playerPet.level;
      const remainingXp = shouldLevelUp ? newXp - (playerPet.level * pet.xpPerLevel) : newXp;

      const { error } = await supabase
        .from("player_pets")
        .update({
          experience: remainingXp,
          level: newLevel,
          last_fed_at: new Date().toISOString(),
        })
        .eq("id", playerPet.id);

      if (error) throw error;
      
      return { pet, leveledUp: shouldLevelUp, newLevel };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["player-pets", studentId] });
      
      if (result.leveledUp) {
        toast({
          title: `🎉 ${result.pet.emoji} ${result.pet.name} Leveled Up!`,
          description: `Now level ${result.newLevel}! Bonus increased!`,
        });
      } else {
        toast({
          title: `${result.pet.emoji} ${result.pet.name} Fed!`,
          description: "+20 XP gained!",
        });
      }
    },
  });

  // Rename a pet
  const renamePet = useMutation({
    mutationFn: async ({ petId, newName }: { petId: string; newName: string }) => {
      if (!studentId) throw new Error("No student ID");
      
      const { error } = await supabase
        .from("player_pets")
        .update({ pet_name: newName })
        .eq("student_id", studentId)
        .eq("pet_type", petId);

      if (error) throw error;
      return newName;
    },
    onSuccess: (newName) => {
      queryClient.invalidateQueries({ queryKey: ["player-pets", studentId] });
      toast({
        title: "Pet Renamed!",
        description: `Your pet is now called ${newName}`,
      });
    },
  });

  // Get total active bonuses from equipped pet
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
    unlockPet: unlockPet.mutate,
    equipPet: equipPet.mutate,
    feedPet: feedPet.mutate,
    renamePet: renamePet.mutate,
    getActiveBonus,
  };
};
