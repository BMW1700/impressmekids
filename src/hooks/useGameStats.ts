import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentStats {
  games_played?: number;
  games_won?: number;
  [key: string]: any;
}

export const useGameStats = () => {
  const { toast } = useToast();

  const updateGameStats = async (won: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useGameStats] No user logged in, skipping stats update');
        return;
      }

      // Get current stats from student_profiles
      const { data: profile, error: fetchError } = await supabase
        .from('student_profiles')
        .select('stats')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[useGameStats] Error fetching profile:', fetchError);
        return;
      }

      if (!profile) {
        console.log('[useGameStats] No student profile found for user');
        return;
      }

      // Parse existing stats or use defaults
      const currentStats: StudentStats = (profile.stats as StudentStats) || {};
      const newGamesPlayed = (currentStats.games_played || 0) + 1;
      const newGamesWon = won ? (currentStats.games_won || 0) + 1 : (currentStats.games_won || 0);

      // Update with merged stats
      const updatedStats: StudentStats = {
        ...currentStats,
        games_played: newGamesPlayed,
        games_won: newGamesWon,
      };

      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ stats: updatedStats })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[useGameStats] Error updating stats:', updateError);
        return;
      }

      console.log(`[useGameStats] Updated: played=${newGamesPlayed}, won=${newGamesWon}`);
      
      if (won) {
        toast({
          title: "🏆 Stats Updated!",
          description: `Games Won: ${newGamesWon}`,
        });
      }
    } catch (error) {
      console.error('[useGameStats] Unexpected error:', error);
    }
  };

  return { updateGameStats };
};
