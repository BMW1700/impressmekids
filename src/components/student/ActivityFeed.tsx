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

  const newCount = activities.filter(a => a.badge === "New").length;

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <BookOpen className="h-5 w-5" />;
      case "grade":
        return <Trophy className="h-5 w-5" />;
      case "achievement":
        return <Star className="h-5 w-5" />;
      case "announcement":
        return <MessageSquare className="h-5 w-5" />;
      case "event":
        return <Calendar className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case "assignment":
        return "icon-circle-blue w-11 h-11";
      case "grade":
        return "icon-circle-gold w-11 h-11";
      case "achievement":
        return "icon-circle-purple w-11 h-11";
      case "announcement":
        return "icon-circle-green w-11 h-11";
      case "event":
        return "icon-circle-orange w-11 h-11";
      default:
        return "icon-circle-purple w-11 h-11";
    }
  };

  return (
    <Card variant="glass" className="hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="icon-circle-purple w-10 h-10">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <span>Recent Activity</span>
            {newCount > 0 && (
              <Badge variant="purple" className="ml-1">{newCount} New</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
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
            <div className="icon-circle-purple w-16 h-16 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Your learning journey starts here!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Complete assignments, practice with AURA, and track your progress.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="gradient">
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
                <div className="flex items-start gap-4 p-4 rounded-xl glass-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className={`${getIconClass(activity.type)} group-hover:scale-110 transition-transform duration-200`}>
                    <span className="text-white">{getIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-bold text-sm">{activity.title}</p>
                        {activity.classroomName && (
                          <p className="text-xs text-muted-foreground">{activity.classroomName}</p>
                        )}
                      </div>
                      {activity.badge && (
                        <Badge 
                          variant={
                            activity.badgeColor === 'red' ? 'red' : 
                            activity.badgeColor === 'orange' ? 'orange' :
                            activity.badgeColor === 'blue' ? 'blue' : 
                            'purple'
                          }
                          className="text-xs shrink-0"
                        >
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
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
