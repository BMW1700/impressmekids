import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative h-2.5 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-secondary/30",
        premium: "progress-premium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out rounded-full",
  {
    variants: {
      gradient: {
        default: "bg-primary",
        purple: "progress-fill-purple",
        blue: "progress-fill-blue",
        green: "progress-fill-green",
        gold: "progress-fill-gold",
        orange: "progress-fill-orange",
        multi: "progress-fill-multi",
      },
    },
    defaultVariants: {
      gradient: "default",
    },
  }
);

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, gradient, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressIndicatorVariants({ gradient }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      data-state="complete"
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };