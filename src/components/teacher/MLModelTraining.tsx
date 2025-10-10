import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const MLModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [lastTraining, setLastTraining] = useState<any>(null);
  const { toast } = useToast();

  const startTraining = async () => {
    setIsTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('train-ml-models');

      if (error) throw error;

      setLastTraining(data.results);
      toast({
        title: "Training Complete",
        description: data.message,
      });
    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: "Training Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>ML Model Training</CardTitle>
        </div>
        <CardDescription>
          Train the Cross-Modal Transfer Network and Q-Learning Agent with collected data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Training Status</p>
            <p className="text-xs text-muted-foreground">
              {lastTraining ? `Last trained: ${new Date(lastTraining.timestamp).toLocaleString()}` : 'Never trained'}
            </p>
          </div>
          <Button onClick={startTraining} disabled={isTraining}>
            {isTraining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start Training
              </>
            )}
          </Button>
        </div>

        {lastTraining && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Training Results</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cross-Modal Network</span>
                  <Badge variant={lastTraining.models.crossModalNetwork.trained ? "default" : "secondary"}>
                    {lastTraining.models.crossModalNetwork.trained ? "Trained" : "Pending"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastTraining.models.crossModalNetwork.examples} training examples
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Q-Learning Agent</span>
                  <Badge variant={lastTraining.models.qLearningAgent.trained ? "default" : "secondary"}>
                    {lastTraining.models.qLearningAgent.trained ? "Trained" : "Pending"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastTraining.models.qLearningAgent.updates} Q-value updates
                </p>
              </div>
            </div>

            {lastTraining.trainingExamples < 100 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-100">
                  <p className="font-medium">Low Training Data</p>
                  <p className="mt-1">
                    Collect at least 100 training examples for optimal model performance. 
                    Currently have {lastTraining.trainingExamples} examples.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
