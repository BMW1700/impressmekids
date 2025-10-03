import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Edit, Trash2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface QuestionGroupCardProps {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: number;
  questionCount: number;
  createdAt: string;
  onViewQuestions: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateFlashcards: () => void;
}

export function QuestionGroupCard({
  title,
  description,
  subject,
  grade,
  questionCount,
  createdAt,
  onViewQuestions,
  onEdit,
  onDelete,
  onGenerateFlashcards,
}: QuestionGroupCardProps) {
  const gradeLabel = grade === 0 ? "K" : `Grade ${grade}`;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Badge variant="secondary">{subject}</Badge>
            <Badge variant="outline">{gradeLabel}</Badge>
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>

          <div className="flex gap-2">
            <Button onClick={onViewQuestions} className="flex-1">
              View Questions
            </Button>
            <Button 
              onClick={onGenerateFlashcards} 
              variant="outline"
              disabled={questionCount === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Flashcards
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}