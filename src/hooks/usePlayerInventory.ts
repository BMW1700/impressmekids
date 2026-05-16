import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STORE_ITEMS, type StoreItem } from "@/lib/gameEconomy";

export interface InventoryItem {
  id: string;
  student_id: string;
  item_id: string;
  item_category: string;
  quantity: number;
  is_equipped: boolean;
  purchased_at: string;
}

export interface ActiveUpgrades {
  attack_boost: number;
  health_boost: number;
  streak_boost: number;
  mp_boost: number;
  crit_boost: number;
  gold_boost: number;
  xp_boost: number;
  defense_boost: number;
}

export const usePlayerInventory = (studentId?: string, gradeMode?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const gm = gradeMode === '6to12' ? '6to12' : 'k5';

  // Fetch inventory — scoped by grade mode
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["player-inventory", studentId, gm],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("player_inventory")
        .select("*")
        .eq("student_id", studentId)
        .eq("grade_mode", gm);

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!studentId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["player-inventory", studentId, gm] });
    queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId, gm] });
    queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
  };

  // Get list of owned item IDs
  const ownedItems = inventory.map(item => item.item_id);

  // Get equipped skin for a specific character (scoped per character, not first-equipped)
  const getEquippedSkin = (character: string): string | null => {
    for (const inv of inventory) {
      if (!inv.is_equipped) continue;
      const skinData = STORE_ITEMS.find(s => s.id === inv.item_id);
      if (skinData?.category === 'skin' && skinData.character === character) {
        return skinData.skinVariant || null;
      }
    }
    return null;
  };

  // Get all active permanent upgrades
  const getActiveUpgrades = (): ActiveUpgrades => {
    const upgrades: ActiveUpgrades = {
      attack_boost: 0,
      health_boost: 0,
      streak_boost: 0,
      mp_boost: 0,
      crit_boost: 0,
      gold_boost: 0,
      xp_boost: 0,
      defense_boost: 0,
    };

    inventory.forEach(invItem => {
      const storeItem = STORE_ITEMS.find(s => s.id === invItem.item_id);
      if (storeItem?.category === 'upgrade' && storeItem.effect && storeItem.value) {
        const effectKey = storeItem.effect as keyof ActiveUpgrades;
        if (effectKey in upgrades) {
          upgrades[effectKey] += storeItem.value;
        }
      }
    });

    return upgrades;
  };

  // Get quantity of a specific item
  const getItemQuantity = (itemId: string): number => {
    const item = inventory.find(i => i.item_id === itemId);
    return item?.quantity || 0;
  };

  // Purchase item mutation
  const purchaseItem = useMutation({
    mutationFn: async ({ item, currentGold }: { item: StoreItem; currentGold: number }) => {
      if (!studentId) throw new Error("Not logged in");
      if (currentGold < item.price) throw new Error("Not enough gold");

      // For non-consumable items (skins, upgrades, powers), check if already owned
      if (item.category !== 'potion') {
        const existing = inventory.find(i => i.item_id === item.id);
        if (existing) throw new Error("Already owned");
      }

      // Deduct gold from campaign_progress — scoped by gradeMode
      let goldQuery = supabase
        .from("campaign_progress")
        .update({ total_gold: currentGold - item.price })
        .eq("student_id", studentId);
      if (gradeMode) goldQuery = goldQuery.eq("grade_mode", gradeMode);
      const { error: goldError } = await goldQuery;
      
      if (goldError) throw goldError;

      // Add to inventory (or increase quantity for potions)
      if (item.category === 'potion') {
        const existing = inventory.find(i => i.item_id === item.id);
        if (existing) {
          const { error } = await supabase
            .from("player_inventory")
            .update({ quantity: existing.quantity + 1 })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("player_inventory")
            .insert({
              student_id: studentId,
              item_id: item.id,
              item_category: item.category,
              quantity: 1,
              is_equipped: false,
            });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("player_inventory")
          .insert({
            student_id: studentId,
            item_id: item.id,
            item_category: item.category,
            quantity: 1,
            is_equipped: false,
          });
        if (error) throw error;
      }

      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["player-inventory", studentId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
      toast({
        title: "✨ Purchase Complete!",
        description: `You bought ${item.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Equip skin mutation
  const equipSkin = useMutation({
    mutationFn: async (itemId: string) => {
      if (!studentId) throw new Error("Not logged in");

      // Find the skin's character type
      const skinData = STORE_ITEMS.find(s => s.id === itemId);
      if (!skinData?.character) throw new Error("Invalid skin");

      // Unequip all other skins for this character
      const otherSkins = inventory.filter(i => {
        const data = STORE_ITEMS.find(s => s.id === i.item_id);
        return data?.category === 'skin' && data?.character === skinData.character && i.is_equipped;
      });

      for (const skin of otherSkins) {
        await supabase
          .from("player_inventory")
          .update({ is_equipped: false })
          .eq("id", skin.id);
      }

      // Equip the new skin
      const targetItem = inventory.find(i => i.item_id === itemId);
      if (targetItem) {
        const { error } = await supabase
          .from("player_inventory")
          .update({ is_equipped: true })
          .eq("id", targetItem.id);
        if (error) throw error;
      }

      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-inventory", studentId] });
      toast({
        title: "🎨 Skin Equipped!",
        description: "Your character now has a new look!",
      });
    },
  });

  // Use/consume potion mutation
  const usePotion = useMutation({
    mutationFn: async (itemId: string) => {
      if (!studentId) throw new Error("Not logged in");
      
      const invItem = inventory.find(i => i.item_id === itemId);
      if (!invItem || invItem.quantity < 1) throw new Error("No potion to use");

      if (invItem.quantity === 1) {
        // Delete the item entirely
        const { error } = await supabase
          .from("player_inventory")
          .delete()
          .eq("id", invItem.id);
        if (error) throw error;
      } else {
        // Reduce quantity
        const { error } = await supabase
          .from("player_inventory")
          .update({ quantity: invItem.quantity - 1 })
          .eq("id", invItem.id);
        if (error) throw error;
      }

      return STORE_ITEMS.find(s => s.id === itemId);
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["player-inventory", studentId] });
      if (item) {
        toast({
          title: "🧪 Potion Used!",
          description: `${item.name} activated!`,
        });
      }
    },
  });

  return {
    inventory,
    isLoading,
    ownedItems,
    getEquippedSkin,
    getActiveUpgrades,
    getItemQuantity,
    purchaseItem,
    equipSkin,
    usePotion,
  };
};