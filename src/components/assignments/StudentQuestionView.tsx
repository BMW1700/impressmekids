import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AudioRecorder } from '@/components/AudioRecorder';

interface StudentQuestionViewProps {
  question: any;
  answer?: any;
  onAnswerChange: (answerData: any) => void;
  questionNumber: number;
  totalQuestions: number;
}

export const StudentQuestionView = ({
  question,
  answer,
  onAnswerChange,
  questionNumber,
  totalQuestions,
}: StudentQuestionViewProps) => {
  const [localAnswer, setLocalAnswer] = useState(answer?.answer_data || {});

  const handleChange = (data: any) => {
    setLocalAnswer(data);
    onAnswerChange(data);
  };

  const renderQuestion = () => {
    const qData = question.question_data;

    switch (question.question_type) {
      case 'question_answer':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{qData.question_text}</h3>
            
            {qData.image_url && (
              <img src={qData.image_url} alt="Question" className="max-w-md rounded-lg" />
            )}
            
            {qData.audio_url && (
              <audio controls src={qData.audio_url} className="w-full max-w-md" />
            )}

            {qData.question_type === 'multiple_choice' && (
              <RadioGroup value={localAnswer.answer_text} onValueChange={(v) => handleChange({ answer_text: v })}>
                {qData.options?.map((option: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="font-normal cursor-pointer">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {qData.question_type === 'true_false' && (
              <RadioGroup value={localAnswer.answer_text} onValueChange={(v) => handleChange({ answer_text: v })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="font-normal cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="font-normal cursor-pointer">False</Label>
                </div>
              </RadioGroup>
            )}

            {qData.question_type === 'short_answer' && (
              <Textarea
                value={localAnswer.answer_text || ''}
                onChange={(e) => handleChange({ answer_text: e.target.value })}
                placeholder="Type your answer here..."
                rows={6}
              />
            )}
          </div>
        );

      case 'reading_comprehension':
        return (
          <div className="space-y-4">
            <div className="p-6 border rounded-lg bg-background max-h-[600px] overflow-y-auto">
              <p className="whitespace-pre-wrap text-lg leading-relaxed">{qData.passage_text}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Highlight important text and add annotations to demonstrate comprehension
            </p>
          </div>
        );

      case 'speaking':
        return (
          <div className="space-y-4">
            {qData.prompt_type === 'text' && (
              <h3 className="text-lg font-semibold">{qData.prompt_text}</h3>
            )}
            
            {qData.prompt_type === 'audio' && qData.prompt_audio_url && (
              <audio controls src={qData.prompt_audio_url} className="w-full max-w-md" />
            )}

            <AudioRecorder
              onAudioReady={(audioUrl, duration) => handleChange({ audio_url: audioUrl, duration_seconds: duration })}
              uploadPath={`student/answer-${question.id}`}
            />
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
          <CardTitle>Question {questionNumber} / {totalQuestions}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {renderQuestion()}
      </CardContent>
    </Card>
  );
};
