import { 
  getBenchmarkStatusLabel, 
  getBenchmarkStatusColor,
  type BenchmarkStatus 
} from "@/lib/fluencyBenchmarks";
import { cn } from "@/lib/utils";

interface BenchmarkStatusBadgeProps {
  status: BenchmarkStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function BenchmarkStatusBadge({ 
  status, 
  size = "md",
  showLabel = true 
}: BenchmarkStatusBadgeProps) {
  const colors = getBenchmarkStatusColor(status);
  const label = getBenchmarkStatusLabel(status);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size]
      )}
    >
      {showLabel ? label : status.replace('_', ' ')}
    </span>
  );
}
