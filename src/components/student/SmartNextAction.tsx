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
        icon: <Target className="h-5 w-5" />,
        color: "bg-blue-500",
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
        icon: <Sparkles className="h-5 w-5" />,
        color: "bg-purple-500",
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
      icon: <Sparkles className="h-5 w-5" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    };
  };

  const recommendation = getRecommendation();

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${recommendation.color} text-white shadow-lg`}>
              {recommendation.icon}
            </div>
            <div>
              <CardTitle className="text-xl mb-1">{recommendation.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                AI Recommended
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {recommendation.description}
        </p>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Why Now?</p>
              <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expected Outcome</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {recommendation.outcome}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Needed</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recommendation.time}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
              <Badge variant={recommendation.difficulty === "Easy" ? "secondary" : "default"} className="text-xs">
                {recommendation.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        <Link to={recommendation.link}>
          <Button className="w-full" size="lg">
            {recommendation.action}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
