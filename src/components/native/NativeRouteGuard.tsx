import { Navigate, useLocation } from "react-router-dom";
import { isBlockedInNativeApp } from "@/lib/native/isNativeApp";

/** Redirects sales/admin pages to home inside the native app only. */
export const NativeRouteGuard = () => {
  const { pathname } = useLocation();
  return isBlockedInNativeApp(pathname) ? <Navigate to="/" replace /> : null;
};
