"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const liquidTabVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-transparent text-foreground/80 hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5",
        active: "relative bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20 dark:ring-white/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LiquidTabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof liquidTabVariants> {
  asChild?: boolean
  isActive?: boolean
}

const LiquidTab = React.forwardRef<HTMLButtonElement, LiquidTabProps>(
  ({ className, variant, size, asChild = false, isActive, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const activeVariant = isActive ? "active" : "default"
    
    return (
      <Comp
        className={cn(liquidTabVariants({ variant: activeVariant, size, className }))}
        ref={ref}
        {...props}
      >
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
            <span className="absolute inset-[1px] rounded-full bg-gradient-to-t from-primary/10 to-transparent" />
          </>
        )}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )
  }
)
LiquidTab.displayName = "LiquidTab"

// Liquid glass style for tabs - clear glass inactive, purple active
export const liquidGlassTabClass = cn(
  // Base styles
  "relative overflow-hidden rounded-xl py-2.5 px-5 text-sm font-medium transition-all duration-300",
  // Default state - clear liquid glass effect (like frosted glass)
  "text-foreground/90 hover:text-foreground",
  "bg-white/10 dark:bg-white/[0.08]",
  "border border-white/30 dark:border-white/15",
  "shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.08)]",
  "backdrop-blur-md",
  "hover:bg-white/15 dark:hover:bg-white/12 hover:border-white/40 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.1)]",
  // Glass shine effect on inactive
  "before:absolute before:inset-0 before:rounded-xl",
  "before:bg-gradient-to-b before:from-white/20 before:via-transparent before:to-transparent",
  "before:pointer-events-none",
  // Active state with purple gradient
  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:via-primary/95 data-[state=active]:to-primary/85",
  "data-[state=active]:text-primary-foreground",
  "data-[state=active]:border-primary/40",
  "data-[state=active]:shadow-[0_4px_20px_hsl(var(--primary)/0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]",
  // Enhanced shine overlay on active
  "data-[state=active]:before:bg-gradient-to-b data-[state=active]:before:from-white/30 data-[state=active]:before:via-white/5 data-[state=active]:before:to-transparent",
  // Subtle scale effects
  "hover:scale-[1.02] data-[state=active]:scale-[1.0]",
  "active:scale-[0.98]"
)

export { LiquidTab, liquidTabVariants }
