// Push notifications temporarily disabled to fix tab-switch reload issue.
// The service worker was causing browser-level reloads when activating updates.

export const usePushNotifications = () => {
  return {
    isSupported: false,
    isSubscribed: false,
    isLoading: false,
    subscribe: async () => false,
    unsubscribe: async () => {},
  };
};
