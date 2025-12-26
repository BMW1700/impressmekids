import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top on route changes to prevent landing mid-page after navigation.
 */
export function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
