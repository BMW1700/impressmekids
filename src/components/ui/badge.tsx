import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Premium gradient badges
        purple: "badge-premium badge-purple border-transparent",
        gold: "badge-premium badge-gold border-transparent",
        green: "badge-premium badge-green border-transparent",
        red: "badge-premium badge-red border-transparent",
        blue: "badge-premium badge-blue border-transparent",
        orange: "badge-premium badge-orange border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };