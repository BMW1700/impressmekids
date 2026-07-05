/**
 * Capacitor bootstrap — runs once on app startup.
 *
 * Safe on web: every plugin call is guarded by `Capacitor.isNativePlatform()`
 * so the web app at yubilearn.com is unaffected.
 *
 * Wires up:
 *  - Status bar styling (matches YubiLearn purple)
 *  - Splash screen auto-hide
 *  - Keyboard behavior for K-5 iPad typing
 *  - Deep link handling for Clever SSO + magic-link auth
 *    (yubilearn://oauth, yubilearn://auth, https://yubilearn.com/* universal links)
 */

import { Capacitor } from '@capacitor/core';

export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const [
      { StatusBar, Style },
      { SplashScreen },
      { Keyboard, KeyboardResize },
      { App },
    ] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/keyboard'),
      import('@capacitor/app'),
    ]);

    // Status bar — light icons over YubiLearn purple
    await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#667eea' }).catch(() => {});
    }

    // Hide branded splash after first paint
    setTimeout(() => {
      SplashScreen.hide().catch(() => {});
    }, 600);

    // Keyboard behavior — native resize is best for K-5 iPad use
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});

    // Deep link handler — Clever SSO + magic links route back into the app.
    // The web equivalent lives in the URL bar; in the app we re-dispatch to React Router.
    App.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url);
        // yubilearn://oauth?... or https://yubilearn.com/...
        const path = url.pathname + url.search + url.hash;
        if (path && path !== '/') {
          window.history.pushState({}, '', path);
          // Notify React Router (BrowserRouter listens to popstate)
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch {
        // Malformed deep link — ignore.
      }
    });
  } catch (err) {
    // Plugins missing in dev or web — non-fatal.
    if (!import.meta.env.PROD) {
      // eslint-disable-next-line no-console
      console.warn('[capacitor] bootstrap skipped:', err);
    }
  }
}
