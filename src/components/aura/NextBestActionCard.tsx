/**
 * Next Best Action Card - Shows AI-recommended action for student
 * Combines all 4 patentable ML models
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateNextBestAction, getActionEmoji } from "@/lib/nextBestActionML";
import { Sparkles, Loader2, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NextBestActionCard = () => {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: actionData, isLoading } = useQuery({
    queryKey: ['next-best-action', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch all required data
      const [auraRecords, skillVector, profile, assignments] = await Promise.all([
        supabase
          .from('aura_records')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(res => res.data || []),
        
        supabase
          .from('student_skill_vectors')
          .select('*')
          .eq('student_id', user.id)
          .maybeSingle()
          .then(res => res.data),
        
        supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(res => res.data),
        
        supabase
          .from('assignment_submissions')
          .select('*, assignments(*)')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(res => res.data || []),
      ]);

      // Generate next best action
      const action = generateNextBestAction({
        auraRecords,
        skillVector,
        studentProfile: profile,
        recentAssignments: assignments,
      });

      return action;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  const handleTakeAction = () => {
    if (!actionData) return;

    switch (actionData.actionType) {
      case 'phoneme_practice':
      case 'speaking_drill':
        navigate('/student/aura-practice');
        break;
      case 'reading_exercise':
        navigate('/student/study');
        break;
      case 'comprehensive_review':
        navigate('/student/aura-practice');
        break;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!actionData) {
    return (
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Recommendation
          </CardTitle>
          <CardDescription>Complete some practice first to get personalized recommendations</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  const difficultyColors = {
    easy: 'green',
    medium: 'blue',
    hard: 'orange',
  } as const;

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden shadow-elegant">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-4xl shadow-lg animate-scale-in">
              {getActionEmoji(actionData.actionType)}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Your Next Best Action
              </CardTitle>
              <CardDescription className="text-base">AI-powered personalized path to mastery</CardDescription>
            </div>
          </div>
          <Badge variant={priorityColors[actionData.priority]} className="text-sm px-3 py-1">
            {actionData.priority.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        <div className="p-5 rounded-xl bg-gradient-to-br from-background to-muted/20 border-2 border-primary/20 shadow-card">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {actionData.title}
          </h3>
          <p className="text-base text-muted-foreground leading-relaxed">{actionData.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</span>
            </div>
            <p className="text-lg font-bold">{actionData.estimatedDuration}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-secondary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty</span>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1.5 font-semibold">
              {actionData.difficulty}
            </Badge>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
          <p className="text-sm font-bold mb-2 text-accent flex items-center gap-2">
            <span className="text-lg">💡</span>
            Why This Matters:
          </p>
          <p className="text-sm leading-relaxed italic">{actionData.reasoning}</p>
        </div>

        <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
          <p className="text-sm font-bold mb-2 flex items-center gap-2">
            <span className="text-lg">🎯</span>
            Expected Outcome:
          </p>
          <p className="text-sm leading-relaxed">{actionData.expectedOutcome}</p>
        </div>

        <Button 
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6 shadow-elegant hover:shadow-yellow transition-all duration-300 hover:scale-[1.02]"
          onClick={handleTakeAction}
        >
          <Sparkles className="mr-2 w-5 h-5" />
          Start Now
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">🧠 Powered by Patented ML Technology</p>
          <p className="text-xs text-muted-foreground">
            Transfer Learning • Cross-Modal Prediction • RL Agent • Adaptive Clustering
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NextBestActionCard;
