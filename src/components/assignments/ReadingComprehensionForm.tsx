import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReadingComprehensionData {
  passage_text?: string;
  enable_coaching?: boolean;
  ocr_confidence?: number;
}

interface ReadingComprehensionFormProps {
  data: ReadingComprehensionData;
  onChange: (data: ReadingComprehensionData) => void;
}

export const ReadingComprehensionForm = ({ data, onChange }: ReadingComprehensionFormProps) => {
  const [localData, setLocalData] = useState<ReadingComprehensionData>(data || {
    enable_coaching: false,
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  // Update local state when data prop changes (e.g., when editing existing question)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData(data);
    }
  }, [data]);

  const handleChange = (field: keyof ReadingComprehensionData, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onChange(updated);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (!base64) throw new Error('Failed to read image');

        // Call OCR function
        const { data: ocrData, error } = await supabase.functions.invoke('extract-text-from-image', {
          body: { image: base64 },
        });

        if (error) throw error;

        if (ocrData.extracted_text) {
          const updatedData = {
            ...localData,
            passage_text: ocrData.extracted_text,
            ocr_confidence: ocrData.confidence
          };
          setLocalData(updatedData);
          onChange(updatedData);
          toast({
            title: 'Success',
            description: `Text extracted with ${Math.round(ocrData.confidence * 100)}% confidence`,
          });
        }
      };
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'Extraction failed',
        description: 'Could not extract text from image',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Reading Passage</Label>
        <Textarea 
          value={localData.passage_text || ''} 
          onChange={(e) => handleChange('passage_text', e.target.value)}
          placeholder="Paste or type the reading passage here..."
          rows={10}
          className="font-serif"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-accent transition-colors">
              {isExtracting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span>Extracting text...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Image for OCR</span>
                </>
              )}
            </div>
            <Input 
              id="image-upload"
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isExtracting}
            />
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="coaching">AI Reading Coach (AURA AI)</Label>
          <p className="text-sm text-muted-foreground">
            Enable real-time AI coaching while students read and annotate
          </p>
        </div>
        <Switch 
          id="coaching"
          checked={localData.enable_coaching || false}
          onCheckedChange={(checked) => handleChange('enable_coaching', checked)}
        />
      </div>

      {localData.ocr_confidence && (
        <p className="text-sm text-muted-foreground">
          OCR Confidence: {Math.round(localData.ocr_confidence * 100)}%
        </p>
      )}
    </div>
  );
};
