import { Capacitor } from "@capacitor/core";

/** True inside the iOS/Android app build (App Store rules: no sales links, no admin tools). */
export const IS_NATIVE_APP = Capacitor.isNativePlatform();

const BLOCKED_PREFIXES = ["/pricing", "/pilot-packet", "/speech-lab", "/super-admin"];

export const isBlockedInNativeApp = (pathname: string) =>
  IS_NATIVE_APP && BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
