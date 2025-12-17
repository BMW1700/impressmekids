/**
 * AI Confidence Badge Component
 * Displays AI confidence level for reading assessments
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface AIConfidenceBadgeProps {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  flaggedWordCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const AIConfidenceBadge = ({
  score,
  level,
  flaggedWordCount = 0,
  size = 'md',
  showTooltip = true,
}: AIConfidenceBadgeProps) => {
  const config = {
    high: {
      label: 'High Confidence',
      shortLabel: 'High',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
      tooltip: 'AI has high confidence in this assessment. Results are reliable.',
    },
    medium: {
      label: 'Medium Confidence',
      shortLabel: 'Medium',
      icon: Shield,
      className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
      tooltip: 'Some words may need teacher verification for 100% accuracy.',
    },
    low: {
      label: 'Low Confidence',
      shortLabel: 'Low',
      icon: AlertTriangle,
      className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
      tooltip: 'Teacher verification recommended for accurate results.',
    },
  };

  const { label, shortLabel, icon: Icon, className, tooltip } = config[level];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`${className} ${sizeClasses[size]} gap-1.5 font-medium`}
    >
      <Icon className={iconSizes[size]} />
      <span>{size === 'sm' ? shortLabel : label}</span>
      {size !== 'sm' && <span className="opacity-70">({score}%)</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
          {flaggedWordCount > 0 && (
            <p className="mt-1 text-amber-600">
              {flaggedWordCount} word{flaggedWordCount > 1 ? 's' : ''} flagged for verification
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
