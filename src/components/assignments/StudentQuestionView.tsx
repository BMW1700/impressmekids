import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VoiceRecorder } from '@/components/aura/VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import type { AudioFeatures } from '@/lib/audioAnalysis';
import type { PhonemeResult } from '@/lib/phonemeDetection';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Early return if question is not loaded yet
  if (!question) {
    console.error('❌ [StudentQuestionView] Question is undefined');
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Question...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please wait while the question loads...</p>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (data: any) => {
    console.log('📝 [StudentQuestionView] Answer changed:', { questionId: question.id, data });
    setLocalAnswer(data);
    onAnswerChange(data);
  };

  const handleVoiceRecordingComplete = async (
    text: string,
    audioUrl: string,
    durationSeconds: number,
    audioFeatures?: AudioFeatures,
    phonemes?: PhonemeResult[]
  ) => {
    setIsAnalyzing(true);
    try {
      // Upload audio to storage
      const audioBlob = await fetch(audioUrl).then(r => r.blob());
      const fileName = `speaking-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assignment-audio')
        .getPublicUrl(fileName);

      // Create AURA record with full analysis
      const { data: session } = await supabase.auth.getSession();
      const studentId = session?.session?.user?.id;

      if (!studentId) throw new Error('Not authenticated');

      // Call analyze-aura edge function for full AI analysis
      const { data: auraData, error: auraError } = await supabase.functions.invoke('analyze-aura', {
        body: {
          audioUrl: publicUrl,
          transcript: text,
          durationSeconds,
          audioFeatures,
          phonemes,
          contextText: question.question_data?.prompt_text || question.question_data?.prompt || '',
          studentId,
        },
      });

      if (auraError) throw auraError;

      // Store the answer with AURA record ID
      const answerData = {
        transcript: text,
        audio_url: publicUrl,
        duration_seconds: durationSeconds,
        aura_record_id: auraData?.auraRecordId,
      };

      handleChange(answerData);
    } catch (error) {
      console.error('Error processing voice recording:', error);
    } finally {
      setIsAnalyzing(false);
    }
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
              <RadioGroup 
                value={localAnswer.answer_text} 
                onValueChange={(v) => handleChange({ answer_text: v })}
                className="space-y-3"
              >
                {qData.options?.map((option: any, idx: number) => {
                  const optionText = typeof option === 'string' ? option : option.text;
                  const optionImage = typeof option === 'object' ? option.image_url : undefined;
                  
                  return (
                    <Card key={idx} className="p-3 cursor-pointer hover:bg-accent transition-colors">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem value={optionText} id={`option-${idx}`} className="mt-1" />
                        <Label 
                          htmlFor={`option-${idx}`} 
                          className="flex-1 font-normal cursor-pointer space-y-2"
                        >
                          <div>{optionText}</div>
                          {optionImage && (
                            <img 
                              src={optionImage} 
                              alt={`Option ${idx + 1}`}
                              className="w-full max-h-40 object-contain rounded border"
                            />
                          )}
                        </Label>
                      </div>
                    </Card>
                  );
                })}
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
            {qData.prompt_type === 'text' && qData.prompt_text && (
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="text-sm font-medium mb-2">📝 Speaking Prompt:</p>
                <h3 className="text-lg font-semibold">{qData.prompt_text}</h3>
              </div>
            )}
            
            {qData.prompt_type === 'audio' && qData.prompt_audio_url && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">🔊 Listen to the prompt:</p>
                <audio controls src={qData.prompt_audio_url} className="w-full max-w-md" />
              </div>
            )}

            <div className="border-2 border-dashed border-primary/20 rounded-lg p-6">
              <p className="text-sm font-medium mb-4 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🎤</span>
                Record your answer with AURA AI
              </p>
              <VoiceRecorder
                onTranscriptionComplete={handleVoiceRecordingComplete}
                isAnalyzing={isAnalyzing}
              />
            </div>
            
            {localAnswer && localAnswer.transcript && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  ✓ Recording complete and analyzed with AURA AI!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your speech has been transcribed and analyzed for pronunciation, clarity, and fluency.
                </p>
              </div>
            )}
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
