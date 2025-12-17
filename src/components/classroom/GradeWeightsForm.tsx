import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Save } from "lucide-react";
import { GradeWeights } from "@/hooks/useClassroomSyllabus";

interface GradeWeightsFormProps {
  initialWeights?: GradeWeights;
  onSave: (weights: GradeWeights) => void;
  isSaving?: boolean;
}

export const GradeWeightsForm = ({
  initialWeights,
  onSave,
  isSaving = false,
}: GradeWeightsFormProps) => {
  const defaultWeights = { test: 35, quiz: 30, homework: 25, attendance: 10, behavior: 0 };
  const getMergedWeights = () => ({ ...defaultWeights, ...initialWeights });
  const [weights, setWeights] = useState<GradeWeights>(getMergedWeights());
  const [isEditing, setIsEditing] = useState(false);

  // Sync state when initialWeights changes (e.g., after data fetch)
  useEffect(() => {
    setWeights(getMergedWeights());
  }, [initialWeights?.test, initialWeights?.quiz, initialWeights?.homework, initialWeights?.attendance, initialWeights?.behavior]);

  const total = weights.test + weights.quiz + weights.homework + weights.attendance + (weights.behavior ?? 0);
  const isValid = total === 100;

  const handleWeightChange = (category: keyof GradeWeights, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 100) {
      setWeights((prev) => ({ ...prev, [category]: numValue }));
    }
  };

  const handleSave = () => {
    if (isValid) {
      onSave(weights);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setWeights(getMergedWeights());
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grade Weight Configuration</CardTitle>
          <CardDescription>
            Current weights for calculating final grades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Tests:</span>
              <span className="text-lg font-bold text-primary">{weights.test}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Quizzes:</span>
              <span className="text-lg font-bold text-primary">{weights.quiz}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Homework:</span>
              <span className="text-lg font-bold text-primary">{weights.homework}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Attendance:</span>
              <span className="text-lg font-bold text-primary">{weights.attendance}%</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Behavior:</span>
              <span className="text-lg font-bold text-primary">{weights.behavior ?? 0}%</span>
            </div>
          </div>
          <Button onClick={() => {
            setWeights(getMergedWeights());
            setIsEditing(true);
          }} className="w-full">
            Edit Weights
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Grade Weights</CardTitle>
        <CardDescription>
          Set the percentage weight for each category. Must total 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Set Attendance or Behavior to 0% if you don't want them to count toward the final grade.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-weight">Test Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                id="test-weight"
                type="number"
                min="0"
                max="100"
                value={weights.test}
                onChange={(e) => handleWeightChange("test", e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground font-medium">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-weight">Quiz Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                id="quiz-weight"
                type="number"
                min="0"
                max="100"
                value={weights.quiz}
                onChange={(e) => handleWeightChange("quiz", e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground font-medium">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="homework-weight">Homework Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                id="homework-weight"
                type="number"
                min="0"
                max="100"
                value={weights.homework}
                onChange={(e) => handleWeightChange("homework", e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground font-medium">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendance-weight">Attendance Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attendance-weight"
                type="number"
                min="0"
                max="100"
                value={weights.attendance}
                onChange={(e) => handleWeightChange("attendance", e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground font-medium">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="behavior-weight">Behavior Weight</Label>
            <div className="flex items-center gap-2">
              <Input
                id="behavior-weight"
                type="number"
                min="0"
                max="100"
                value={weights.behavior}
                onChange={(e) => handleWeightChange("behavior", e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground font-medium">%</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span
              className={`text-2xl font-bold ${
                isValid ? "text-green-600 dark:text-green-400" : "text-destructive"
              }`}
            >
              {total}%
            </span>
          </div>
          {!isValid && (
            <p className="text-sm text-destructive mt-2">
              Weights must sum to exactly 100%
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Weights
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
