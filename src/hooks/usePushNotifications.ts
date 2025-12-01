import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Push API is supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in your browser.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Permission Granted',
          description: 'You will now receive push notifications.',
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'You have denied push notification permissions.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permissions.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BBOQmeU-GndAJbPRu4b5Dt7mmnIjOH3AxacLwY5oznBCrF4JBVzLRkeJr_w_qoDmqu2o3gRlEjjkD7gP9snuJoI'
        ),
      });

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const subscriptionJson = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Subscribed',
        description: 'You are now subscribed to push notifications.',
      });
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Push notification subscription error:', error);
      
      let errorMessage = "Could not enable push notifications";
      
      if (error?.message?.includes('Registration failed')) {
        errorMessage = "Service worker registration failed. Please refresh the page.";
      } else if (error?.message?.includes('denied')) {
        errorMessage = "Notification permission was denied";
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = "Push notifications are not supported in this browser";
      } else if (error?.code === '23505') {
        errorMessage = "Subscription already exists";
      }
      
      toast({
        title: 'Subscription Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }

        setIsSubscribed(false);
        toast({
          title: 'Unsubscribed',
          description: 'You have unsubscribed from push notifications.',
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Unsubscribe Failed',
        description: 'Failed to unsubscribe from push notifications.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}