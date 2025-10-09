import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { AudioRecorder } from '@/components/AudioRecorder';

interface SpeakingQuestionData {
  prompt_type?: 'text' | 'audio';
  prompt_text?: string;
  prompt_audio_url?: string;
  expected_duration_seconds?: number;
}

interface SpeakingQuestionFormProps {
  data: SpeakingQuestionData;
  onChange: (data: SpeakingQuestionData) => void;
}

export const SpeakingQuestionForm = ({ data, onChange }: SpeakingQuestionFormProps) => {
  const [localData, setLocalData] = useState<SpeakingQuestionData>(data || {
    prompt_type: 'text',
    expected_duration_seconds: 60,
  });

  const handleChange = (field: keyof SpeakingQuestionData, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const handleAudioReady = (audioUrl: string, duration: number) => {
    handleChange('prompt_audio_url', audioUrl);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Prompt Type</Label>
        <RadioGroup 
          value={localData.prompt_type} 
          onValueChange={(v) => handleChange('prompt_type', v)}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text" className="font-normal cursor-pointer">Text Prompt</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="audio" id="audio" />
            <Label htmlFor="audio" className="font-normal cursor-pointer">Audio Prompt</Label>
          </div>
        </RadioGroup>
      </div>

      {localData.prompt_type === 'text' ? (
        <div>
          <Label>Question / Prompt</Label>
          <Textarea 
            value={localData.prompt_text || ''} 
            onChange={(e) => handleChange('prompt_text', e.target.value)}
            placeholder="Enter the speaking prompt here..."
            rows={4}
          />
        </div>
      ) : (
        <div>
          <Label>Record or Upload Audio Prompt</Label>
          <AudioRecorder 
            onAudioReady={handleAudioReady}
            uploadPath={`teacher/speaking-prompt-${Date.now()}`}
            showUploadButton={true}
          />
          {localData.prompt_audio_url && (
            <p className="text-sm text-muted-foreground mt-2">
              Audio prompt uploaded successfully
            </p>
          )}
        </div>
      )}

      <div>
        <Label>Expected Response Duration (seconds)</Label>
        <Input 
          type="number" 
          value={localData.expected_duration_seconds || ''} 
          onChange={(e) => handleChange('expected_duration_seconds', parseInt(e.target.value))}
          placeholder="60"
          min={10}
          max={300}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Students will have this much time to record their response
        </p>
      </div>
    </div>
  );
};
