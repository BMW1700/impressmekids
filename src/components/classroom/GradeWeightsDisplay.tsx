import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GradeWeights } from "@/hooks/useClassroomSyllabus";

interface GradeWeightsDisplayProps {
  weights: GradeWeights;
}

export const GradeWeightsDisplay = ({ weights }: GradeWeightsDisplayProps) => {
  const categories = [
    { name: "Tests", value: weights.test, color: "bg-red-500" },
    { name: "Quizzes", value: weights.quiz, color: "bg-yellow-500" },
    { name: "Homework", value: weights.homework, color: "bg-blue-500" },
    { name: "Attendance", value: weights.attendance, color: "bg-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Weight Breakdown</CardTitle>
        <CardDescription>
          How your final grade is calculated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{category.name}</span>
              <span className="text-lg font-bold text-primary">{category.value}%</span>
            </div>
            <Progress value={category.value} className="h-3" />
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Your final grade is calculated by weighting each category according to these
              percentages. Each assignment within a category contributes equally to that
              category's average.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
