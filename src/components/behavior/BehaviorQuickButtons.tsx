import { Button } from "@/components/ui/button";
import { useBehaviorRecords } from "@/hooks/useBehaviorRecords";

interface BehaviorQuickButtonsProps {
  studentId: string;
  classroomId: string;
}

export const BehaviorQuickButtons = ({ studentId, classroomId }: BehaviorQuickButtonsProps) => {
  const { categories, addRecord } = useBehaviorRecords(classroomId);

  const positiveCategories = categories?.filter(c => c.category_type === 'positive').slice(0, 5) || [];
  const negativeCategories = categories?.filter(c => c.category_type === 'negative').slice(0, 5) || [];

  const handleClick = (categoryId: string) => {
    addRecord.mutate({ student_id: studentId, category_id: categoryId });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {positiveCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleClick(category.id)}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={addRecord.isPending}
        >
          {category.icon} +{category.point_value}
        </Button>
      ))}
      {negativeCategories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleClick(category.id)}
          size="sm"
          variant="destructive"
          disabled={addRecord.isPending}
        >
          {category.icon} {category.point_value}
        </Button>
      ))}
    </div>
  );
};
