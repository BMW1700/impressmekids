import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor config — App Store / TestFlight ready.
 *
 * IMPORTANT: The `server` block has been removed so the app loads bundled
 * assets from `dist/` (required for Apple review — Guideline 2.5.2).
 *
 * For local hot-reload on a physical device during development ONLY,
 * temporarily add (and remove before archiving):
 *
 *   server: {
 *     url: 'https://8b261911-409a-4a04-8594-3e15f3d59496.lovableproject.com?forceHideBadge=true',
 *     cleartext: true,
 *   },
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.8b261911409a4a0485943e15f3d59496',
  appName: 'yubilearn',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    // Kept OFF: our OAuth flow (Google, Clever, Supabase magic links) redirects
    // through third-party origins that are NOT app-bound. Turning this on would
    // silently break every social login on device unless every provider host
    // is also declared as an associated domain — which is fragile and not
    // required by App Store policy.
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#667eea',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'native',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
