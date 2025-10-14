import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Plus, X, Upload, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [localData, setLocalData] = useState<QuestionAnswerData>(data || {
    question_type: 'short_answer',
    options: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('file');

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB for question images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `question-${timestamp}.${extension}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('assignment-question-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignment-question-images')
        .getPublicUrl(data.path);

      // Update form data with the public URL
      handleChange('image_url', publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    handleChange('image_url', '');
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

      <div>
        <Label>Question Image (Optional)</Label>
        <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as 'url' | 'file')} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="h-4 w-4 mr-2" />
              Image URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-2">
            {localData.image_url ? (
              <Card className="p-4 space-y-2">
                <div className="relative">
                  <img 
                    src={localData.image_url} 
                    alt="Question preview" 
                    className="w-full max-h-48 object-contain rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Image uploaded successfully</p>
              </Card>
            ) : (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a JPG, PNG, GIF, or WebP image (max 5MB)
                </p>
                {isUploading && (
                  <p className="text-xs text-primary">Uploading...</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-2">
            <Input 
              value={localData.image_url || ''} 
              onChange={(e) => handleChange('image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Paste a direct link to an image
            </p>
            {localData.image_url && (
              <Card className="p-2">
                <img 
                  src={localData.image_url} 
                  alt="Question preview" 
                  className="w-full max-h-48 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
  );
};
