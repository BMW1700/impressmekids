import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentNotifications } from "@/hooks/useStudentNotifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  Megaphone,
  Calendar,
  Award,
} from "lucide-react";

interface StudentNotificationBellProps {
  studentId: string;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "assignment":
      return <BookOpen className="h-4 w-4" />;
    case "grade":
      return <Trophy className="h-4 w-4" />;
    case "announcement":
      return <Megaphone className="h-4 w-4" />;
    case "event":
      return <Calendar className="h-4 w-4" />;
    case "achievement":
      return <Award className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export const StudentNotificationBell = ({ studentId }: StudentNotificationBellProps) => {
  const { notifications, unreadCount, markAllAsRead } = useStudentNotifications(studentId);

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
      // Mark all as read when opening the dropdown
      markAllAsRead();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see updates about assignments, grades, and announcements here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.link}
                  className="block p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div
                      className={`${notification.bgColor} ${notification.color} p-2 rounded-lg h-fit`}
                    >
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm line-clamp-1">
                          {notification.title}
                        </p>
                        {notification.badge && (
                          <Badge
                            variant={
                              notification.badgeColor === "red"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              notification.badgeColor === "orange"
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : notification.badgeColor === "yellow"
                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                : notification.badgeColor === "blue"
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : ""
                            }
                          >
                            {notification.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.description}
                      </p>
                      {notification.classroomName && (
                        <p className="text-xs text-muted-foreground/80">
                          {notification.classroomName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-xs" asChild>
              <Link to="/student/dashboard?section=today">View All Activity</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
