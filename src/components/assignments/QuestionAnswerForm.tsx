import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface QuestionAnswerData {
  subject?: string;
  question_type?: 'short_answer' | 'multiple_choice' | 'true_false';
  question_text?: string;
  answer_text?: string;
  explanation?: string;
  image_url?: string;
  audio_url?: string;
  options?: string[]; // For multiple choice
}

interface QuestionAnswerFormProps {
  data: QuestionAnswerData;
  onChange: (data: QuestionAnswerData) => void;
}

export const QuestionAnswerForm = ({ data, onChange }: QuestionAnswerFormProps) => {
  const [localData, setLocalData] = useState<QuestionAnswerData>(data || {
    question_type: 'short_answer',
    options: [],
  });

  // Initialize multiple choice with 2 options
  useEffect(() => {
    if (localData.question_type === 'multiple_choice' && (!localData.options || localData.options.length === 0)) {
      handleChange('options', ['', '']);
    }
  }, [localData.question_type]);

  const handleChange = (field: keyof QuestionAnswerData, value: any) => {
    const updated = { ...localData, [field]: value };
    
    // Clear options when switching away from multiple choice
    if (field === 'question_type' && value !== 'multiple_choice') {
      updated.options = [];
      updated.answer_text = '';
    }
    
    setLocalData(updated);
    onChange(updated);
  };

  const addOption = () => {
    const options = [...(localData.options || []), ''];
    handleChange('options', options);
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(localData.options || [])];
    options[index] = value;
    handleChange('options', options);
  };

  const removeOption = (index: number) => {
    const options = (localData.options || []).filter((_, i) => i !== index);
    handleChange('options', options);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Subject</Label>
        <Input 
          value={localData.subject || ''} 
          onChange={(e) => handleChange('subject', e.target.value)}
          placeholder="e.g., Math, Science"
        />
      </div>

      <div>
        <Label>Question Type</Label>
        <Select value={localData.question_type} onValueChange={(v) => handleChange('question_type', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short_answer">Short Answer</SelectItem>
            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
            <SelectItem value="true_false">True / False</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Question Text</Label>
        <Textarea 
          value={localData.question_text || ''} 
          onChange={(e) => handleChange('question_text', e.target.value)}
          placeholder="Enter your question here..."
          rows={3}
        />
      </div>

      {localData.question_type === 'multiple_choice' && (
        <div className="space-y-3">
          <Label>Answer Options</Label>
          <RadioGroup value={localData.answer_text} onValueChange={(v) => handleChange('answer_text', v)}>
            {(localData.options || []).map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <RadioGroupItem value={option} id={`option-${index}`} disabled={!option} />
                <Input 
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeOption(index)}
                  disabled={(localData.options || []).length <= 2}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </RadioGroup>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
          <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
        </div>
      )}

      {localData.question_type === 'short_answer' && (
        <div>
          <Label>Correct Answer</Label>
          <Input 
            value={localData.answer_text || ''} 
            onChange={(e) => handleChange('answer_text', e.target.value)}
            placeholder="Enter the correct answer..."
          />
        </div>
      )}

      {localData.question_type === 'true_false' && (
        <div>
          <Label>Correct Answer</Label>
          <Select value={localData.answer_text} onValueChange={(v) => handleChange('answer_text', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select correct answer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label>Explanation (Optional)</Label>
        <Textarea 
          value={localData.explanation || ''} 
          onChange={(e) => handleChange('explanation', e.target.value)}
          placeholder="Explain the answer..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Image URL (Optional)</Label>
          <Input 
            value={localData.image_url || ''} 
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Audio URL (Optional)</Label>
          <Input 
            value={localData.audio_url || ''} 
            onChange={(e) => handleChange('audio_url', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};
