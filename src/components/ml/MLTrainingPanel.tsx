/**
 * MLTrainingPanel - Admin/Teacher panel to view and trigger ML training
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, RefreshCw, CheckCircle2, Clock, Database } from 'lucide-react';
import { useMLContextSafe } from './MLStatusProvider';
import { useToast } from '@/hooks/use-toast';

export const MLTrainingPanel = () => {
  const mlContext = useMLContextSafe();
  const { toast } = useToast();
  const [isTriggering, setIsTriggering] = useState(false);
  
  if (!mlContext) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          ML context not available
        </CardContent>
      </Card>
    );
  }
  
  const { modelStatus, isLoading, isTraining, triggerTraining } = mlContext;
  
  const handleTriggerTraining = async () => {
    setIsTriggering(true);
    try {
      const result = await triggerTraining();
      if (result.success) {
        toast({
          title: "Training Triggered",
          description: result.message,
        });
      } else {
        toast({
          title: "Training Issue",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Training Failed",
        description: "Could not start training. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };
  
  const accuracy = modelStatus.crossModalNetwork.accuracy || 0;
  const trainingExamples = modelStatus.crossModalNetwork.trainingExamples || 0;
  
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">ML Training Status</CardTitle>
            <CardDescription>
              Our proprietary AI models for reading/speaking prediction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cross-Modal Network</span>
            </div>
            <Badge variant={modelStatus.crossModalNetwork.loaded ? "default" : "secondary"}>
              {modelStatus.crossModalNetwork.loaded ? "Active" : "Not Trained"}
            </Badge>
            {modelStatus.crossModalNetwork.version && (
              <span className="text-xs text-muted-foreground ml-2">
                v{modelStatus.crossModalNetwork.version}
              </span>
            )}
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Q-Learning Engine</span>
            </div>
            <Badge variant={modelStatus.qLearningTable.loaded ? "default" : "secondary"}>
              {modelStatus.qLearningTable.loaded ? "Active" : "Not Trained"}
            </Badge>
            {modelStatus.qLearningTable.version && (
              <span className="text-xs text-muted-foreground ml-2">
                v{modelStatus.qLearningTable.version}
              </span>
            )}
          </div>
        </div>
        
        {/* Training Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Training Examples
            </span>
            <span className="font-medium">{trainingExamples}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Model Accuracy
            </span>
            <span className="font-medium">{accuracy > 0 ? `${Math.round(accuracy * 100)}%` : 'N/A'}</span>
          </div>
          
          {accuracy > 0 && (
            <Progress value={accuracy * 100} className="h-2" />
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Q-Table States
            </span>
            <span className="font-medium">{modelStatus.qLearningTable.totalStates}</span>
          </div>
        </div>
        
        {/* Training Button */}
        <Button
          onClick={handleTriggerTraining}
          disabled={isLoading || isTraining || isTriggering}
          className="w-full"
        >
          {isTraining || isTriggering ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Training in Progress...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Trigger Model Training
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Training runs automatically when 10+ records exist. Manual trigger available for immediate updates.
        </p>
      </CardContent>
    </Card>
  );
};
