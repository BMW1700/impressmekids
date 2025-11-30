import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Target, BookOpen, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";

interface SmartNotificationsProps {
  onNavigate?: (path: string) => void;
}

const notificationIcons: Record<string, any> = {
  practice_reminder: Bell,
  improvement: TrendingUp,
  milestone: Target,
  recommendation: BookOpen,
  streak: Flame
};

const notificationColors: Record<string, string> = {
  practice_reminder: "text-blue-600",
  improvement: "text-green-600",
  milestone: "text-purple-600",
  recommendation: "text-amber-600",
  streak: "text-orange-600"
};

export const SmartNotifications = ({ onNavigate }: SmartNotificationsProps) => {
  const { notifications, loading } = useSmartNotifications();

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </Card>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification, index) => {
        const Icon = notificationIcons[notification.type] || Bell;
        const colorClass = notificationColors[notification.type] || "text-primary";

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`${colorClass} mt-1`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>

                {/* Action Button */}
                {notification.action && onNavigate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate(notification.action.path)}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
