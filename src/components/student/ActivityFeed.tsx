import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  MessageSquare,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "assignment" | "grade" | "announcement" | "achievement";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  badge?: string;
}

export const ActivityFeed = () => {
  // Mock data - will be replaced with real data later
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "assignment",
      title: "New Assignment Posted",
      description: "Reading Comprehension Quiz - Chapter 5",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: <BookOpen className="h-4 w-4" />,
      badge: "Due in 2 days",
    },
    {
      id: "2",
      type: "grade",
      title: "Grade Posted",
      description: "Math Quiz - Score: 95%",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      icon: <CheckCircle className="h-4 w-4" />,
      badge: "A",
    },
    {
      id: "3",
      type: "announcement",
      title: "Class Announcement",
      description: "Field trip next Friday - permission slips required",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "4",
      type: "achievement",
      title: "Achievement Unlocked!",
      description: "Completed 10 AURA practice sessions",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      icon: <Trophy className="h-4 w-4" />,
      badge: "🏆",
    },
  ];

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "assignment":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "grade":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "announcement":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "achievement":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student/dashboard?section=announcements">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <div
                className={`p-2 rounded-lg border ${getActivityColor(
                  activity.type
                )}`}
              >
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {activity.description}
                    </p>
                  </div>
                  {activity.badge && (
                    <Badge variant="secondary" className="shrink-0">
                      {activity.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
