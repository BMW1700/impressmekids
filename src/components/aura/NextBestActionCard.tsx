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
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{getActionEmoji(actionData.actionType)}</div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Next Best Action
              </CardTitle>
              <CardDescription>AI-powered personalized recommendation</CardDescription>
            </div>
          </div>
          <Badge variant={priorityColors[actionData.priority]}>
            {actionData.priority} priority
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">{actionData.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{actionData.description}</p>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-primary/20">
          <p className="text-xs font-medium mb-1 text-primary">💡 Why this matters:</p>
          <p className="text-xs text-muted-foreground italic">{actionData.reasoning}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{actionData.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className={`text-${difficultyColors[actionData.difficulty]}-600 border-${difficultyColors[actionData.difficulty]}-300`}>
              {actionData.difficulty}
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs font-medium mb-1">🎯 Expected Outcome:</p>
          <p className="text-xs">{actionData.expectedOutcome}</p>
        </div>

        <Button 
          className="w-full bg-gradient-primary hover:opacity-90"
          onClick={handleTakeAction}
        >
          Start Now
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by 4 patented ML models: Transfer Learning • Cross-Modal Prediction • RL Agent • Adaptive Clustering
        </p>
      </CardContent>
    </Card>
  );
};

export default NextBestActionCard;
