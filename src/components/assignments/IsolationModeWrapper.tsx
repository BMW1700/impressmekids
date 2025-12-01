import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Lock } from "lucide-react";

interface IsolationModeWrapperProps {
  currentQuestion: number;
  totalQuestions: number;
  canProceed: boolean;
  onNext: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export const IsolationModeWrapper = ({
  currentQuestion,
  totalQuestions,
  canProceed,
  onNext,
  onSubmit,
  children,
}: IsolationModeWrapperProps) => {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-orange-50 border-orange-200">
        <div className="flex items-center gap-2 text-orange-800">
          <Lock className="h-4 w-4" />
          <p className="text-sm font-medium">
            Isolation Mode Active - You cannot go back to previous questions
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Question {currentQuestion + 1} of {totalQuestions}</span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {children}

      <div className="flex justify-end">
        {isLastQuestion ? (
          <Button
            onClick={onSubmit}
            disabled={!canProceed}
            size="lg"
            className="gap-2"
          >
            Submit Assignment
            <ChevronRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className="gap-2"
          >
            Next Question
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
