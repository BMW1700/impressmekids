import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";

interface SmartNextActionProps {
  assignmentStats: any;
  studentStats: any;
}

export const SmartNextAction = ({ assignmentStats, studentStats }: SmartNextActionProps) => {
  const totalAssignments = assignmentStats?.total_assignments || 0;
  const completedAssignments = assignmentStats?.completed_assignments || 0;
  const gamesPlayed = studentStats?.games_played || 0;
  
  // AI-powered recommendation logic
  const getRecommendation = () => {
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    
    if (completionRate < 50) {
      return {
        title: "Complete Pending Assignments",
        description: "You have unfinished assignments that need attention. Let's get them done!",
        reason: "Your completion rate is below 50%. Finishing assignments will boost your grades.",
        outcome: "Improve grade by 15-20%",
        time: "30-45 minutes",
        difficulty: "Medium",
        action: "View Assignments",
        link: "/student/dashboard",
        icon: <Target className="h-6 w-6" />,
        iconClass: "icon-circle-blue",
      };
    }
    
    if (gamesPlayed < 3) {
      return {
        title: "Try Learning Games",
        description: "Engage with fun educational games to reinforce concepts while having fun!",
        reason: "Games help you retain information 40% better through active learning.",
        outcome: "Better retention & engagement",
        time: "10-15 minutes",
        difficulty: "Easy",
        action: "Play Games",
        link: "/games",
        icon: <Sparkles className="h-6 w-6" />,
        iconClass: "icon-circle-purple",
      };
    }
    
    return {
      title: "Practice with AURA AI",
      description: "Enhance your reading fluency with personalized AI coaching and real-time feedback.",
      reason: "Students who practice with AURA show 25% improvement in reading confidence.",
      outcome: "Improve fluency by 15%",
      time: "5-10 minutes",
      difficulty: "Easy",
      action: "Start Practice",
      link: "/student/aura-practice",
      icon: <Sparkles className="h-6 w-6" />,
      iconClass: "icon-circle-purple",
    };
  };

  const recommendation = getRecommendation();

  return (
    <Card variant="premium" className="relative overflow-hidden">
      {/* Purple gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-start gap-3 md:gap-4">
          <div className={`${recommendation.iconClass} shrink-0`}>
            {recommendation.icon}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl md:text-lg lg:text-2xl mb-2 break-words">{recommendation.title}</CardTitle>
            <Badge variant="gold" className="shadow-glow-gold">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Recommended
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-5">
        <p className="text-muted-foreground text-base leading-relaxed">
          {recommendation.description}
        </p>
        
        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-semibold">Why Now?</p>
              <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-2 lg:gap-4 pt-3 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expected Outcome</p>
              <p className="text-sm font-bold text-green-500">
                {recommendation.outcome}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Needed</p>
              <p className="text-sm font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                {recommendation.time}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
              <Badge variant={recommendation.difficulty === "Easy" ? "green" : "purple"} className="text-xs">
                {recommendation.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        <Link to={recommendation.link} className="block">
          <Button variant="gradient" size="lg" className="w-full shadow-glow-purple">
            {recommendation.action}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
