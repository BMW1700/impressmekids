import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PremiumStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  color: "blue" | "green" | "purple" | "orange" | "pink" | "yellow" | "red";
  className?: string;
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(217_91%_60%/0.4)]",
    textColor: "text-blue-600 dark:text-blue-400",
    trendBg: "bg-blue-500/10 text-blue-600",
  },
  green: {
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(160_84%_39%/0.4)]",
    textColor: "text-emerald-600 dark:text-emerald-400",
    trendBg: "bg-emerald-500/10 text-emerald-600",
  },
  purple: {
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(263_70%_58%/0.4)]",
    textColor: "text-purple-600 dark:text-purple-400",
    trendBg: "bg-purple-500/10 text-purple-600",
  },
  orange: {
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(32_95%_52%/0.4)]",
    textColor: "text-orange-600 dark:text-orange-400",
    trendBg: "bg-orange-500/10 text-orange-600",
  },
  pink: {
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(330_81%_60%/0.4)]",
    textColor: "text-pink-600 dark:text-pink-400",
    trendBg: "bg-pink-500/10 text-pink-600",
  },
  yellow: {
    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(38_95%_54%/0.4)]",
    textColor: "text-amber-600 dark:text-amber-400",
    trendBg: "bg-amber-500/10 text-amber-600",
  },
  red: {
    iconBg: "bg-gradient-to-br from-red-500 to-rose-500",
    iconShadow: "shadow-[0_8px_24px_-4px_hsl(0_84%_60%/0.4)]",
    textColor: "text-red-600 dark:text-red-400",
    trendBg: "bg-red-500/10 text-red-600",
  },
};

export const PremiumStatCard = React.forwardRef<HTMLDivElement, PremiumStatCardProps>(
  ({ title, value, subtitle, icon: Icon, trend, color, className, onClick }, ref) => {
    const styles = colorStyles[color];

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-card p-5 shadow-glass-md backdrop-blur-sm transition-all duration-300",
          "hover:shadow-glass-lg hover:-translate-y-1",
          onClick && "cursor-pointer",
          className
        )}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-card-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative z-10 flex items-start gap-4">
          {/* Icon Container */}
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              styles.iconBg,
              styles.iconShadow
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
              {trend && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold",
                    styles.trendBg,
                    "border-0"
                  )}
                >
                  {trend.direction === "up" && "↑"}
                  {trend.direction === "down" && "↓"}
                  {trend.value}
                </Badge>
              )}
            </div>
            <p
              className={cn(
                "text-3xl font-bold tracking-tight mt-1 animate-count-up",
                styles.textColor
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

PremiumStatCard.displayName = "PremiumStatCard";