import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Trophy, Calendar, MessageSquare, Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: "assignment",
      title: "New Assignment",
      description: "Reading Comprehension Quiz - Chapter 5",
      time: "2 hours ago",
      icon: <BookOpen className="h-4 w-4" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-600/10",
      badge: "Due in 2 days",
      link: "/student/dashboard",
    },
    {
      id: 2,
      type: "grade",
      title: "Grade Posted",
      description: "Math Quiz - 95% (A)",
      time: "5 hours ago",
      icon: <Trophy className="h-4 w-4" />,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-600/10",
      badge: "+5 points",
      link: "/student/dashboard",
    },
    {
      id: 3,
      type: "achievement",
      title: "Achievement Unlocked",
      description: "5-day streak! Keep it going!",
      time: "1 day ago",
      icon: <Star className="h-4 w-4" />,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-600/10",
      badge: "New",
      link: "/student/dashboard",
    },
    {
      id: 4,
      type: "announcement",
      title: "Class Announcement",
      description: "Science Fair this Friday - Bring your projects!",
      time: "1 day ago",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-600/10",
      link: "/student/dashboard",
    },
    {
      id: 5,
      type: "event",
      title: "Upcoming Event",
      description: "Parent-Teacher Conference",
      time: "2 days ago",
      icon: <Calendar className="h-4 w-4" />,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-600/10",
      badge: "Tomorrow",
      link: "/student/calendar",
    },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Activity
            <Badge variant="secondary" className="ml-2">5 New</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/student/dashboard">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link 
              key={activity.id}
              to={activity.link}
              className="block"
            >
              <div
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border border-transparent hover:border-primary/20 cursor-pointer group"
              >
                <div className={`p-2.5 rounded-xl ${activity.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <div className={activity.color}>{activity.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm">{activity.title}</p>
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
      </CardContent>
    </Card>
  );
};
