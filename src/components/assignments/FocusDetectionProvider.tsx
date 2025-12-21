import { useEffect, useRef, ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FocusDetectionProviderProps {
  enabled: boolean;
  submissionId?: string;
  onViolation: () => void;
  children: ReactNode;
}

export const FocusDetectionProvider = ({ enabled, submissionId, onViolation, children }: FocusDetectionProviderProps) => {
  const violationCountRef = useRef(0);
  const hasShownWarningRef = useRef(false);
  const lastVisibilityChangeRef = useRef<number>(0);

  // Persist violations to database
  const persistViolation = useCallback(async (count: number) => {
    if (!submissionId) return;
    
    try {
      await supabase
        .from('assignment_submissions')
        .update({ focus_violations: count })
        .eq('id', submissionId);
    } catch (error) {
      console.error('Failed to persist focus violation:', error);
    }
  }, [submissionId]);

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
        lastVisibilityChangeRef.current = Date.now();
        violationCountRef.current += 1;
        onViolation();
        persistViolation(violationCountRef.current);
        
        toast.error("Focus Lost", {
          description: `Tab switch detected (${violationCountRef.current} total)`,
          duration: 3000,
        });
      }
    };

    const handleBlur = () => {
      // Only count blur if it wasn't already counted by visibilitychange
      // (visibilitychange fires first for tab switches, blur follows)
      const timeSinceVisibilityChange = Date.now() - lastVisibilityChangeRef.current;
      if (timeSinceVisibilityChange > 100) {
        // This is a standalone blur (e.g., clicking outside browser window)
        violationCountRef.current += 1;
        onViolation();
        persistViolation(violationCountRef.current);
        
        toast.error("Focus Lost", {
          description: `Window focus lost (${violationCountRef.current} total)`,
          duration: 3000,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, onViolation, persistViolation]);

  return <>{children}</>;
};
