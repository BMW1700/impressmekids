import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-gradient-to-r from-secondary to-secondary-dark text-secondary-foreground shadow-sm hover:shadow-md",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-sm hover:shadow-md animate-glow-urgent",
        outline: 
          "border-border bg-background/50 text-foreground backdrop-blur-sm",
        success:
          "border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:shadow-md",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm hover:shadow-md",
        premium:
          "border-transparent bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 shadow-glow-secondary animate-float-badge font-bold",
        glass:
          "border-white/20 bg-white/10 backdrop-blur-sm text-foreground",
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };