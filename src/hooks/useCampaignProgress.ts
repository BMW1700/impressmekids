import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignProgress {
  id: string;
  student_id: string;
  current_world: number;
  world_progress: Record<string, string[]>; // world number -> array of rescued story titles
  total_damage_dealt: number;
  longest_streak: number;
  books_rescued: number;
  grog_battles_won: number;
  total_xp_earned: number;
  created_at: string;
  updated_at: string;
  // New addiction layer fields
  login_streak?: number;
  longest_login_streak?: number;
  last_login_date?: string;
  equipped_pet_id?: string;
  total_gold?: number;
  total_achievements?: number;
}

interface BattleSession {
  id: string;
  student_id: string;
  story_title: string;
  story_category: string | null;
  world_number: number;
  enemy_type: string;
  enemy_max_hp: number;
  enemy_current_hp: number;
  player_hp: number;
  player_max_hp: number;
  damage_dealt: number;
  words_read: number;
  correct_words: number;
  longest_streak: number;
  current_streak: number;
  battle_status: string;
  xp_earned: number;
  started_at: string;
  ended_at: string | null;
}

export const useCampaignProgress = (studentId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch campaign progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["campaign-progress", studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("campaign_progress")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) throw error;
      
      // If no progress exists, return default values
      if (!data) {
        return {
          current_world: 1,
          world_progress: { "1": [], "2": [], "3": [], "4": [] },
          total_damage_dealt: 0,
          longest_streak: 0,
          books_rescued: 0,
          grog_battles_won: 0,
          total_xp_earned: 0,
        } as Partial<CampaignProgress>;
      }

      return data as CampaignProgress;
    },
    enabled: !!studentId,
  });

  // Fetch recent battle sessions
  const { data: recentBattles, isLoading: battlesLoading } = useQuery({
    queryKey: ["campaign-battles", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("campaign_battle_sessions")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BattleSession[];
    },
    enabled: !!studentId,
  });

  // Initialize or update campaign progress
  const initializeProgress = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student ID");

      const { data, error } = await supabase
        .from("campaign_progress")
        .upsert({
          student_id: studentId,
          current_world: 1,
          world_progress: { "1": [], "2": [], "3": [], "4": [] },
          total_damage_dealt: 0,
          longest_streak: 0,
          books_rescued: 0,
          grog_battles_won: 0,
          total_xp_earned: 0,
        }, {
          onConflict: 'student_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
    },
  });

  // Start a new battle session
  const startBattle = useMutation({
    mutationFn: async ({
      storyTitle,
      storyCategory,
      worldNumber,
      enemyType,
      enemyMaxHp,
    }: {
      storyTitle: string;
      storyCategory?: string;
      worldNumber: number;
      enemyType: string;
      enemyMaxHp: number;
    }) => {
      if (!studentId) throw new Error("No student ID");

      const { data, error } = await supabase
        .from("campaign_battle_sessions")
        .insert({
          student_id: studentId,
          story_title: storyTitle,
          story_category: storyCategory,
          world_number: worldNumber,
          enemy_type: enemyType,
          enemy_max_hp: enemyMaxHp,
          enemy_current_hp: enemyMaxHp,
          player_hp: 100,
          player_max_hp: 100,
          battle_status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BattleSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId] });
    },
  });

  // Update battle session
  const updateBattle = useMutation({
    mutationFn: async ({
      battleId,
      updates,
    }: {
      battleId: string;
      updates: Partial<BattleSession>;
    }) => {
      const { data, error } = await supabase
        .from("campaign_battle_sessions")
        .update(updates)
        .eq("id", battleId)
        .select()
        .single();

      if (error) throw error;
      return data as BattleSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId] });
    },
  });

  // Complete a battle (victory or defeat)
  const completeBattle = useMutation({
    mutationFn: async ({
      battleId,
      victory,
      xpEarned,
      damageDealt,
      longestStreak,
      storyTitle,
      worldNumber,
      goldEarned = 0, // NEW: Accept gold from battle
    }: {
      battleId: string;
      victory: boolean;
      xpEarned: number;
      damageDealt: number;
      longestStreak: number;
      storyTitle: string;
      worldNumber: number;
      goldEarned?: number; // NEW: Optional gold parameter
    }) => {
      if (!studentId) throw new Error("No student ID");

      // Update battle session
      await supabase
        .from("campaign_battle_sessions")
        .update({
          battle_status: victory ? 'victory' : 'defeat',
          xp_earned: xpEarned,
          ended_at: new Date().toISOString(),
        })
        .eq("id", battleId);

      // If victory, update campaign progress
      if (victory) {
        // Get current progress
        const { data: currentProgress } = await supabase
          .from("campaign_progress")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle();

        const worldProgress = (currentProgress?.world_progress as Record<string, string[]>) || { "1": [], "2": [], "3": [], "4": [] };
        const worldKey = worldNumber.toString();
        
        // Add story to world progress if not already rescued
        if (!worldProgress[worldKey]?.includes(storyTitle)) {
          worldProgress[worldKey] = [...(worldProgress[worldKey] || []), storyTitle];
        }

        const newBooksRescued = (currentProgress?.books_rescued || 0) + 1;
        const newDamageDealt = (currentProgress?.total_damage_dealt || 0) + damageDealt;
        const newLongestStreak = Math.max(currentProgress?.longest_streak || 0, longestStreak);
        const newXpEarned = (currentProgress?.total_xp_earned || 0) + xpEarned;
        const newBattlesWon = (currentProgress?.grog_battles_won || 0) + 1;

        // Check if should unlock next world
        let newCurrentWorld = currentProgress?.current_world || 1;
        const worldUnlockThresholds: Record<number, number> = { 2: 3, 3: 8, 4: 14 };
        
        for (const [world, threshold] of Object.entries(worldUnlockThresholds)) {
          if (newBooksRescued >= threshold && newCurrentWorld < parseInt(world)) {
            newCurrentWorld = parseInt(world);
            toast({
              title: "🎉 New World Unlocked!",
              description: `You've unlocked World ${world}!`,
            });
          }
        }

        // Upsert campaign progress - NOW INCLUDES GOLD
        await supabase
          .from("campaign_progress")
          .upsert({
            student_id: studentId,
            current_world: newCurrentWorld,
            world_progress: worldProgress,
            total_damage_dealt: newDamageDealt,
            longest_streak: newLongestStreak,
            books_rescued: newBooksRescued,
            grog_battles_won: newBattlesWon,
            total_xp_earned: newXpEarned,
            total_gold: (currentProgress?.total_gold || 0) + goldEarned, // NEW: Sync gold to wallet
          }, {
            onConflict: 'student_id',
          });
      }

      return { victory, xpEarned };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId] });
      
      if (data.victory) {
        toast({
          title: "📖 Book Rescued!",
          description: `You earned ${data.xpEarned} XP! Princess Ella thanks you!`,
        });
      }
    },
  });

  // Reset campaign progress for "Start New Game"
  const resetCampaign = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student ID");

      const { data, error } = await supabase
        .from("campaign_progress")
        .update({
          current_world: 1,
          world_progress: { "1": [], "2": [], "3": [], "4": [] },
          total_damage_dealt: 0,
          longest_streak: 0,
          books_rescued: 0,
          grog_battles_won: 0,
          total_xp_earned: 0,
          // Keep gold and pets - they earned those!
          // total_gold: 0, // Optional: reset gold too
        })
        .eq("student_id", studentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId] });
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId] });
      toast({
        title: "🔄 New Adventure Begins!",
        description: "Your campaign has been reset. Good luck, hero!",
      });
    },
  });

  return {
    progress,
    progressLoading,
    recentBattles,
    battlesLoading,
    initializeProgress: initializeProgress.mutate,
    startBattle: startBattle.mutateAsync,
    updateBattle: updateBattle.mutate,
    completeBattle: completeBattle.mutateAsync,
    resetCampaign: resetCampaign.mutateAsync,
  };
};
