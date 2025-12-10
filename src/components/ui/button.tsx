import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary to-primary-dark text-primary-foreground shadow-glow-primary hover:shadow-lg hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-glow-urgent hover:shadow-lg hover:brightness-110",
        outline:
          "border-2 border-input bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/30 shadow-glass-sm hover:shadow-glass-md",
        secondary:
          "bg-gradient-to-r from-secondary via-secondary to-secondary-dark text-secondary-foreground shadow-glow-secondary hover:shadow-lg hover:brightness-110",
        ghost: 
          "hover:bg-accent/80 hover:text-accent-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        premium:
          "bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-primary-foreground shadow-glow-primary hover:shadow-lg hover:brightness-110",
        success:
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-glow-success hover:shadow-lg hover:brightness-110",
        glass:
          "bg-card/80 backdrop-blur-xl border border-white/10 text-foreground shadow-glass-sm hover:shadow-glass-md hover:bg-card/90",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };