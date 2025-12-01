import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();

  useEffect(() => {
    // Show prompt after 5 seconds if notifications are supported and not subscribed
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('push-prompt-dismissed');
      if (isSupported && !isSubscribed && !dismissed) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="relative max-w-sm p-6 shadow-lg border-primary/20">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex gap-4 items-start">
          <div className="rounded-full bg-primary/10 p-3">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg mb-1">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get instant notifications for safety alerts, assignments, and important updates.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1"
              >
                Enable Notifications
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};