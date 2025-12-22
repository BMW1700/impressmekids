/**
 * MLStatusBadge - Visual indicator showing ML model status
 * Shows whether predictions are ML-powered or rule-based fallback
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useMLContextSafe } from './MLStatusProvider';

interface MLStatusBadgeProps {
  variant?: 'default' | 'compact' | 'detailed';
  showIfFallback?: boolean;
}

export const MLStatusBadge = ({ variant = 'default', showIfFallback = false }: MLStatusBadgeProps) => {
  const mlContext = useMLContextSafe();
  
  // If not in provider, show nothing
  if (!mlContext) return null;
  
  const { modelStatus, isLoading, isTraining } = mlContext;
  const isMLPowered = modelStatus.crossModalNetwork.loaded || modelStatus.qLearningTable.loaded;
  
  // Don't show badge if using fallback and showIfFallback is false
  if (!isMLPowered && !showIfFallback) return null;
  
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        {variant !== 'compact' && 'Loading ML...'}
      </Badge>
    );
  }
  
  if (isTraining) {
    return (
      <Badge variant="secondary" className="gap-1 text-xs animate-pulse">
        <Brain className="h-3 w-3" />
        {variant !== 'compact' && 'Training...'}
      </Badge>
    );
  }
  
  if (isMLPowered) {
    const trainingExamples = modelStatus.crossModalNetwork.trainingExamples || 0;
    const accuracy = modelStatus.crossModalNetwork.accuracy || 0;
    
    if (variant === 'detailed') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="default" className="gap-1 text-xs bg-gradient-to-r from-primary to-primary/80">
              <Sparkles className="h-3 w-3" />
              ML-Powered
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">Machine Learning Active</p>
              <p className="text-xs text-muted-foreground">
                Trained on {trainingExamples} examples
              </p>
              {accuracy > 0 && (
                <p className="text-xs text-muted-foreground">
                  Accuracy: {Math.round(accuracy * 100)}%
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <Badge variant="default" className="gap-1 text-xs bg-gradient-to-r from-primary to-primary/80">
        <Sparkles className="h-3 w-3" />
        {variant !== 'compact' && 'ML-Powered'}
      </Badge>
    );
  }
  
  // Fallback indicator
  if (showIfFallback) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            {variant !== 'compact' && 'Rule-based'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Using rule-based predictions. ML models will activate when more data is collected.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return null;
};
