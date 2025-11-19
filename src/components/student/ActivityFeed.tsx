import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Trophy, Calendar, MessageSquare, Star, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentActivityFeed } from "@/hooks/useStudentActivityFeed";

interface ActivityFeedProps {
  studentId: string;
}

export const ActivityFeed = ({ studentId }: ActivityFeedProps) => {
  const { data: activities = [], isLoading } = useStudentActivityFeed(studentId);

  // Calculate new count (items created in last 24h with "New" badge)
  const newCount = activities.filter(a => a.badge === "New").length;

  // Map type to icon
  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <BookOpen className="h-4 w-4" />;
      case "grade":
        return <Trophy className="h-4 w-4" />;
      case "achievement":
        return <Star className="h-4 w-4" />;
      case "announcement":
        return <MessageSquare className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
            {newCount > 0 && (
              <Badge variant="secondary" className="ml-2">{newCount} New</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your learning journey starts here!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Complete assignments, practice with AURA, and track your progress.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="default">
                <Link to="/student/dashboard">View Assignments</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/student/aura-practice">Practice with AURA</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Link 
                key={activity.id}
                to={activity.link}
                className="block"
              >
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-primary/20 cursor-pointer group">
                  <div className={`p-2.5 rounded-xl ${activity.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <div className={activity.color}>{getIcon(activity.type)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-sm">{activity.title}</p>
                        {activity.classroomName && (
                          <p className="text-xs text-muted-foreground">{activity.classroomName}</p>
                        )}
                      </div>
                      {activity.badge && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {activity.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
