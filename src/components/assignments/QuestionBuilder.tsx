import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grip, Trash2 } from 'lucide-react';
import { QuestionAnswerForm } from './QuestionAnswerForm';
import { ReadingComprehensionForm } from './ReadingComprehensionForm';
import { SpeakingQuestionForm } from './SpeakingQuestionForm';

interface Question {
  id: string;
  sequence: number;
  question_type: 'question_answer' | 'reading_comprehension' | 'speaking' | null;
  question_data: any;
  points?: number;
}

interface QuestionBuilderProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
  dragHandleProps?: any;
}

export const QuestionBuilder = ({ question, onUpdate, onDelete, dragHandleProps }: QuestionBuilderProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleTypeChange = (type: string) => {
    onUpdate({
      ...question,
      question_type: type as any,
      question_data: {},
    });
  };

  const handleDataChange = (data: any) => {
    onUpdate({
      ...question,
      question_data: data,
    });
    setShowPreview(true);
  };

  const renderForm = () => {
    switch (question.question_type) {
      case 'question_answer':
        return <QuestionAnswerForm data={question.question_data} onChange={handleDataChange} />;
      case 'reading_comprehension':
        return <ReadingComprehensionForm data={question.question_data} onChange={handleDataChange} />;
      case 'speaking':
        return <SpeakingQuestionForm data={question.question_data} onChange={handleDataChange} />;
      default:
        return null;
    }
  };

  const renderPreview = () => {
    if (!showPreview || !question.question_data) return null;

    switch (question.question_type) {
      case 'question_answer':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold">{question.question_data.question_text}</h4>
            {question.question_data.image_url && (
              <img src={question.question_data.image_url} alt="Question" className="max-w-md rounded-lg" />
            )}
            <textarea 
              className="w-full p-3 border rounded-lg" 
              placeholder="Student will type answer here..." 
              disabled
              rows={4}
            />
          </div>
        );
      case 'reading_comprehension':
        return (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-background max-h-96 overflow-y-auto">
              <p className="whitespace-pre-wrap">{question.question_data.passage_text}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Students can highlight and annotate this passage
            </p>
          </div>
        );
      case 'speaking':
        return (
          <div className="space-y-4">
            {question.question_data.prompt_type === 'text' && (
              <p className="font-medium">{question.question_data.prompt_text}</p>
            )}
            {question.question_data.prompt_type === 'audio' && question.question_data.prompt_audio_url ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-sm text-green-700 dark:text-green-300">Audio uploaded successfully - students will be able to play it</span>
              </div>
            ) : question.question_data.prompt_type === 'audio' ? (
              <p className="text-sm text-muted-foreground">Audio is being uploaded...</p>
            ) : null}
            <Button disabled>
              <span className="mr-2">🎤</span>
              Record Audio
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <Grip className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>Question {question.sequence}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Choose Response Format</label>
            <Select value={question.question_type || ''} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select question type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question_answer">Question / Answer</SelectItem>
                <SelectItem value="reading_comprehension">Reading Comprehension</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`points-${question.id}`}>Points Worth</Label>
            <Input
              id={`points-${question.id}`}
              type="number"
              min="1"
              max="100"
              value={question.points || 10}
              onChange={(e) => onUpdate({ ...question, points: parseInt(e.target.value) || 10 })}
              placeholder="10"
            />
          </div>
        </div>

        {question.question_type && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Question Setup</h4>
              {renderForm()}
            </div>

            {showPreview && (
              <div>
                <h4 className="font-semibold mb-3">Live Preview (Student View)</h4>
                <Card className="p-4 bg-muted">
                  {renderPreview()}
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
