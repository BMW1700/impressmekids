import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  message: string | null;
  student: {
    display_name: string;
  };
  classroom: {
    name: string;
  };
}

interface ParentNotificationBellProps {
  parentId: string;
}

export const ParentNotificationBell = ({ parentId }: ParentNotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (parentId) {
      loadNotifications();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('parent-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'parent_access_requests',
            filter: `parent_id=eq.${parentId}`
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [parentId]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('parent_access_requests')
      .select(`
        id,
        status,
        created_at,
        resolved_at,
        message,
        parent_notified,
        student_id,
        classroom_id
      `)
      .eq('parent_id', parentId)
      .neq('status', 'pending')
      .order('resolved_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    // Fetch student and classroom details separately
    const enrichedData = await Promise.all(
      (data || []).map(async (notification: any) => {
        const studentResult = await supabase
          .from('public_profiles')
          .select('display_name')
          .eq('id', notification.student_id)
          .single();

        // Only fetch classroom if classroom_id exists (for teacher-type requests)
        let classroomResult = null;
        if (notification.classroom_id) {
          classroomResult = await supabase
            .from('classrooms')
            .select('name')
            .eq('id', notification.classroom_id)
            .single();
        }

        return {
          ...notification,
          student: studentResult.data || { display_name: 'Unknown Student' },
          classroom: classroomResult?.data || { name: 'Admin Approved' }
        };
      })
    );

    setNotifications(enrichedData);
    
    // Count unread notifications
    const unread = enrichedData.filter((n: any) => !n.parent_notified).length || 0;
    setUnreadCount(unread);
  };

  const markAsRead = async () => {
    if (unreadCount === 0) return;

    const unreadIds = notifications
      .filter((n: any) => !n.parent_notified)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('parent_access_requests')
      .update({ parent_notified: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
      return;
    }

    setUnreadCount(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      markAsRead();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'denied':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Access Approved';
      case 'denied':
        return 'Access Denied';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-background border shadow-lg">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification: any) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="px-4 py-3 cursor-default focus:bg-accent/50"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded-md text-xs font-medium mb-1",
                          getStatusColor(notification.status)
                        )}>
                          {getStatusText(notification.status)}
                        </div>
                        <p className="text-sm font-medium">
                          {notification.student?.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.classroom?.name}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(notification.resolved_at || notification.created_at)}
                      </span>
                    </div>
                    {!notification.parent_notified && (
                      <div className="w-2 h-2 rounded-full bg-primary absolute left-2" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
