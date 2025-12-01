import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface AntiCheatingSettingsProps {
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  isolationMode: boolean;
  focusDetection: boolean;
  timePerQuestion?: number;
  onShuffleQuestionsChange: (value: boolean) => void;
  onShuffleAnswersChange: (value: boolean) => void;
  onIsolationModeChange: (value: boolean) => void;
  onFocusDetectionChange: (value: boolean) => void;
  onTimePerQuestionChange: (value: number | undefined) => void;
}

export const AntiCheatingSettings = ({
  shuffleQuestions,
  shuffleAnswers,
  isolationMode,
  focusDetection,
  timePerQuestion,
  onShuffleQuestionsChange,
  onShuffleAnswersChange,
  onIsolationModeChange,
  onFocusDetectionChange,
  onTimePerQuestionChange,
}: AntiCheatingSettingsProps) => {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">Anti-Cheating Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure security features to maintain assessment integrity
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="shuffle-questions">Shuffle Questions</Label>
            <p className="text-sm text-muted-foreground">
              Randomize question order for each student
            </p>
          </div>
          <Switch
            id="shuffle-questions"
            checked={shuffleQuestions}
            onCheckedChange={onShuffleQuestionsChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="shuffle-answers">Shuffle Answer Choices</Label>
            <p className="text-sm text-muted-foreground">
              Randomize multiple choice answer order
            </p>
          </div>
          <Switch
            id="shuffle-answers"
            checked={shuffleAnswers}
            onCheckedChange={onShuffleAnswersChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isolation-mode">Isolation Mode</Label>
            <p className="text-sm text-muted-foreground">
              Show one question at a time, prevent going back
            </p>
          </div>
          <Switch
            id="isolation-mode"
            checked={isolationMode}
            onCheckedChange={onIsolationModeChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="focus-detection">Focus Detection</Label>
            <p className="text-sm text-muted-foreground">
              Track when student switches tabs or windows
            </p>
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-orange-600" />
              <p className="text-xs text-orange-600">
                Privacy notice: Students will be informed
              </p>
            </div>
          </div>
          <Switch
            id="focus-detection"
            checked={focusDetection}
            onCheckedChange={onFocusDetectionChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-per-question">Time Per Question (seconds)</Label>
          <Input
            id="time-per-question"
            type="number"
            placeholder="Optional"
            value={timePerQuestion || ''}
            onChange={(e) => onTimePerQuestionChange(e.target.value ? parseInt(e.target.value) : undefined)}
            min={10}
            max={600}
          />
          <p className="text-sm text-muted-foreground">
            Optional time limit for each question (leave empty for no limit)
          </p>
        </div>
      </div>
    </Card>
  );
};
