import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { GradeMode } from "@/lib/gameTheme";

interface CampaignProgress {
  id: string;
  student_id: string;
  current_world: number;
  world_progress: Record<string, string[]>;
  total_damage_dealt: number;
  longest_streak: number;
  books_rescued: number;
  grog_battles_won: number;
  total_xp_earned: number;
  created_at: string;
  updated_at: string;
  login_streak?: number;
  longest_login_streak?: number;
  last_login_date?: string;
  equipped_pet_id?: string;
  total_gold?: number;
  total_achievements?: number;
  grade_mode?: string;
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

const DEFAULT_PROGRESS: Partial<CampaignProgress> = {
  current_world: 1,
  world_progress: { "1": [], "2": [], "3": [], "4": [] },
  total_damage_dealt: 0,
  longest_streak: 0,
  books_rescued: 0,
  grog_battles_won: 0,
  total_xp_earned: 0,
};

export const useCampaignProgress = (studentId?: string, gradeMode: GradeMode = 'k5') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["campaign-progress", studentId, gradeMode],
    queryFn: async () => {
      if (!studentId) return null;

      const { data, error } = await supabase
        .from("campaign_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("grade_mode", gradeMode)
        .maybeSingle();

      if (error) {
        console.error("[useCampaignProgress] load failed", { studentId, gradeMode, error });
        throw error;
      }
      return (data as CampaignProgress) || DEFAULT_PROGRESS;
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: recentBattles, isLoading: battlesLoading } = useQuery({
    queryKey: ["campaign-battles", studentId, gradeMode],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from("campaign_battle_sessions")
        .select("*")
        .eq("student_id", studentId)
        .eq("grade_mode", gradeMode)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BattleSession[];
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const initializeProgress = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("No student ID");

      const { data, error } = await supabase
        .from("campaign_progress")
        .upsert({
          student_id: studentId,
          grade_mode: gradeMode,
          current_world: 1,
          world_progress: { "1": [], "2": [], "3": [], "4": [] },
          total_damage_dealt: 0,
          longest_streak: 0,
          books_rescued: 0,
          grog_battles_won: 0,
          total_xp_earned: 0,
        }, {
          onConflict: 'student_id,grade_mode',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId, gradeMode] });
    },
  });

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
          grade_mode: gradeMode,
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
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId, gradeMode] });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId, gradeMode] });
    },
  });

  const completeBattle = useMutation({
    mutationFn: async ({
      battleId,
      victory,
      xpEarned,
      damageDealt,
      longestStreak,
      storyTitle,
      worldNumber,
      goldEarned = 0,
      isBossVictory = false,
    }: {
      battleId: string;
      victory: boolean;
      xpEarned: number;
      damageDealt: number;
      longestStreak: number;
      storyTitle: string;
      worldNumber: number;
      goldEarned?: number;
      isBossVictory?: boolean;
    }) => {
      if (!studentId) throw new Error("No student ID");

      await supabase
        .from("campaign_battle_sessions")
        .update({
          battle_status: victory ? 'victory' : 'defeat',
          xp_earned: xpEarned,
          ended_at: new Date().toISOString(),
        })
        .eq("id", battleId);

      if (victory) {
        const { data: currentProgress } = await supabase
          .from("campaign_progress")
          .select("*")
          .eq("student_id", studentId)
          .eq("grade_mode", gradeMode)
          .maybeSingle();

        const worldProgress = (currentProgress?.world_progress as Record<string, string[]>) || { "1": [], "2": [], "3": [], "4": [] };
        const worldKey = worldNumber.toString();
        
        if (!worldProgress[worldKey]?.includes(storyTitle)) {
          worldProgress[worldKey] = [...(worldProgress[worldKey] || []), storyTitle];
        }

        const newBooksRescued = (currentProgress?.books_rescued || 0) + 1;
        const newDamageDealt = (currentProgress?.total_damage_dealt || 0) + damageDealt;
        const newLongestStreak = Math.max(currentProgress?.longest_streak || 0, longestStreak);
        const newXpEarned = (currentProgress?.total_xp_earned || 0) + xpEarned;
        const newBattlesWon = (currentProgress?.grog_battles_won || 0) + 1;

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

        // Build victory arena unlocked list
        const existingArenaUnlocked = (currentProgress as any)?.victory_arena_unlocked || [];
        const arenaUnlocked = isBossVictory && !existingArenaUnlocked.includes(worldNumber)
          ? [...existingArenaUnlocked, worldNumber]
          : existingArenaUnlocked;
        const arenaCompletions = isBossVictory
          ? ((currentProgress as any)?.victory_arena_completions || 0) + 1
          : ((currentProgress as any)?.victory_arena_completions || 0);

        await supabase
          .from("campaign_progress")
          .upsert({
            student_id: studentId,
            grade_mode: gradeMode,
            current_world: newCurrentWorld,
            world_progress: worldProgress,
            total_damage_dealt: newDamageDealt,
            longest_streak: newLongestStreak,
            books_rescued: newBooksRescued,
            grog_battles_won: newBattlesWon,
            total_xp_earned: newXpEarned,
            total_gold: (currentProgress?.total_gold || 0) + goldEarned,
            victory_arena_unlocked: arenaUnlocked,
            victory_arena_completions: arenaCompletions,
          } as any, {
            onConflict: 'student_id,grade_mode',
          });
      }

      return { victory, xpEarned };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-progress", studentId, gradeMode] });
      queryClient.invalidateQueries({ queryKey: ["campaign-battles", studentId, gradeMode] });
      
      if (data.victory) {
        toast({
          title: "📖 Book Rescued!",
          description: `You earned ${data.xpEarned} XP! Princess Ella thanks you!`,
        });
      }
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
  };
};
