import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8b261911409a4a0485943e15f3d59496',
  appName: 'nabulearn',
  webDir: 'dist',
  // Hot-reload from the Lovable sandbox so you can iterate live on a real iPad.
  // Comment out the `server` block before producing a TestFlight / Play Store build
  // so the app loads bundled assets from `dist/` instead.
  server: {
    url: 'https://8b261911-409a-4a04-8594-3e15f3d59496.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    // Required for AURA mic access; surfaced in Info.plist by Capacitor.
    // (You can also edit Info.plist directly after `npx cap add ios`.)
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
