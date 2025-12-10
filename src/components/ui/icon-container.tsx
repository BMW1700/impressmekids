import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface IconContainerProps {
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange" | "pink" | "yellow" | "red" | "primary" | "secondary";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const colorStyles = {
  blue: "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_8px_24px_-4px_hsl(217_91%_60%/0.35)]",
  green: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_8px_24px_-4px_hsl(160_84%_39%/0.35)]",
  purple: "bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_24px_-4px_hsl(263_70%_58%/0.35)]",
  orange: "bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_8px_24px_-4px_hsl(32_95%_52%/0.35)]",
  pink: "bg-gradient-to-br from-pink-500 to-rose-500 shadow-[0_8px_24px_-4px_hsl(330_81%_60%/0.35)]",
  yellow: "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-[0_8px_24px_-4px_hsl(38_95%_54%/0.35)]",
  red: "bg-gradient-to-br from-red-500 to-rose-500 shadow-[0_8px_24px_-4px_hsl(0_84%_60%/0.35)]",
  primary: "bg-gradient-to-br from-primary to-primary-dark shadow-glow-primary",
  secondary: "bg-gradient-to-br from-secondary to-secondary-dark shadow-glow-secondary",
};

const sizeStyles = {
  sm: { container: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  md: { container: "h-12 w-12 rounded-xl", icon: "h-6 w-6" },
  lg: { container: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
  xl: { container: "h-16 w-16 rounded-2xl", icon: "h-8 w-8" },
};

export const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  ({ icon: Icon, color, size = "md", className, animate }, ref) => {
    const colorStyle = colorStyles[color];
    const sizeStyle = sizeStyles[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center transition-transform duration-300",
          colorStyle,
          sizeStyle.container,
          animate && "hover:scale-110 hover:animate-icon-bounce",
          className
        )}
      >
        <Icon className={cn("text-white", sizeStyle.icon)} />
      </div>
    );
  }
);

IconContainer.displayName = "IconContainer";