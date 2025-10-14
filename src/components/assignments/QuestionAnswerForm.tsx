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

interface OptionData {
  text: string;
  image_url?: string;
}

interface QuestionAnswerData {
  subject?: string;
  question_type?: 'short_answer' | 'multiple_choice' | 'true_false';
  question_text?: string;
  answer_text?: string;
  explanation?: string;
  image_url?: string;
  audio_url?: string;
  options?: OptionData[]; // For multiple choice
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
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);

  // Initialize multiple choice with 2 options
  useEffect(() => {
    if (localData.question_type === 'multiple_choice') {
      if (!localData.options || localData.options.length === 0) {
        handleChange('options', [
          { text: '', image_url: '' },
          { text: '', image_url: '' }
        ]);
      } else {
        // Auto-migrate old string[] format to new OptionData[] format
        const firstOption = localData.options[0];
        if (typeof firstOption === 'string') {
          const migratedOptions = (localData.options as any[]).map((opt: any) => ({
            text: opt,
            image_url: ''
          }));
          handleChange('options', migratedOptions);
        }
      }
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
    const options = [...(localData.options || []), { text: '', image_url: '' }];
    handleChange('options', options);
  };

  const updateOptionText = (index: number, text: string) => {
    const options = [...(localData.options || [])];
    options[index] = { ...options[index], text };
    handleChange('options', options);
  };

  const removeOption = (index: number) => {
    const options = (localData.options || []).filter((_, i) => i !== index);
    handleChange('options', options);
  };

  const handleOptionImageUpload = async (
    index: number, 
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingOptionIndex(index);

    try {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `option-${timestamp}-${index}.${extension}`;

      const { data, error } = await supabase.storage
        .from('assignment-question-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('assignment-question-images')
        .getPublicUrl(data.path);

      const updatedOptions = [...(localData.options || [])];
      updatedOptions[index] = {
        ...updatedOptions[index],
        image_url: publicUrl
      };
      handleChange('options', updatedOptions);

      toast({
        title: "Success",
        description: "Option image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingOptionIndex(null);
    }
  };

  const clearOptionImage = (index: number) => {
    const updatedOptions = [...(localData.options || [])];
    updatedOptions[index] = {
      ...updatedOptions[index],
      image_url: ''
    };
    handleChange('options', updatedOptions);
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
        <div className="space-y-4">
          <Label>Answer Options</Label>
          <RadioGroup 
            value={localData.answer_text} 
            onValueChange={(v) => handleChange('answer_text', v)}
          >
            {(localData.options || []).map((option, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex gap-2 items-start">
                  <RadioGroupItem 
                    value={option.text} 
                    id={`option-${index}`} 
                    disabled={!option.text}
                    className="mt-2"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        value={option.text}
                        onChange={(e) => updateOptionText(index, e.target.value)}
                        placeholder={`Option ${index + 1} text`}
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
                    
                    <div className="space-y-2">
                      {option.image_url ? (
                        <div className="relative">
                          <img 
                            src={option.image_url} 
                            alt={`Option ${index + 1}`}
                            className="w-full max-h-32 object-contain rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => clearOptionImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => handleOptionImageUpload(index, e)}
                            disabled={uploadingOptionIndex === index}
                            className="text-xs"
                            id={`option-image-${index}`}
                          />
                          <Label 
                            htmlFor={`option-image-${index}`}
                            className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            {uploadingOptionIndex === index ? 'Uploading...' : 'Add image (optional)'}
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </RadioGroup>
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
          <p className="text-xs text-muted-foreground">
            Select the radio button next to the correct answer. Add images to options for visual questions.
          </p>
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
