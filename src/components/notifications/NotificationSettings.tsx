import { Bell, BellOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
          {isSubscribed && (
            <Badge variant="default" className="ml-auto">
              Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Receive instant notifications for safety alerts, assignments, and important updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Browser Notifications</p>
            <p className="text-sm text-muted-foreground">
              Get notified even when the app is not open
            </p>
          </div>
          {isSubscribed ? (
            <Button
              variant="outline"
              onClick={unsubscribe}
              disabled={isLoading}
            >
              Disable
            </Button>
          ) : (
            <Button
              onClick={subscribe}
              disabled={isLoading}
            >
              Enable
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">You'll receive notifications for:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Safety alerts and drill updates</li>
              <li>Assignment due dates and grades</li>
              <li>Calendar events and reminders</li>
              <li>At-risk student alerts (for teachers)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};