import { useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";

interface FocusDetectionProviderProps {
  enabled: boolean;
  onViolation: () => void;
  children: ReactNode;
}

export const FocusDetectionProvider = ({ enabled, onViolation, children }: FocusDetectionProviderProps) => {
  const violationCountRef = useRef(0);
  const hasShownWarningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Show initial warning
    if (!hasShownWarningRef.current) {
      toast.warning("Focus Detection Active", {
        description: "Switching tabs or windows will be recorded for your teacher.",
        duration: 5000,
      });
      hasShownWarningRef.current = true;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        violationCountRef.current += 1;
        onViolation();
        
        toast.error("Focus Lost", {
          description: `Tab switch detected (${violationCountRef.current} total)`,
          duration: 3000,
        });
      }
    };

    const handleBlur = () => {
      // Track window focus loss
      violationCountRef.current += 1;
      onViolation();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, onViolation]);

  return <>{children}</>;
};
