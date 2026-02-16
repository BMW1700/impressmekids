import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTour } from "./DemoTourGuide";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DemoHighlightProps {
  stepId: string;
  tooltip: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a UI element with:
 * 1. A hover tooltip describing what it does
 * 2. A pulsing highlight ring when this is the active tour step
 */
export const DemoHighlight = ({ stepId, tooltip, children, className }: DemoHighlightProps) => {
  const { activeStepId } = useTour();
  const isActive = activeStepId === stepId;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative transition-all duration-300",
              isActive && "z-50",
              className
            )}
          >
            {isActive && (
              <>
                <div className="absolute -inset-2 rounded-2xl border-2 border-primary animate-pulse pointer-events-none z-10" />
                <div className="absolute -inset-2 rounded-2xl bg-primary/10 pointer-events-none z-0" />
              </>
            )}
            <div className="relative z-10">{children}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
