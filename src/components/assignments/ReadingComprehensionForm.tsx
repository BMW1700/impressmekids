import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, BookOpen, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch stories from reading_library
  const { data: stories, isLoading: loadingStories } = useQuery({
    queryKey: ['reading-library-stories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_library')
        .select('id, title, description, passage_text, grade_level, category, word_count')
        .order('title');
      if (error) throw error;
      return data || [];
    },
  });

  // Filter stories based on search
  const filteredStories = stories?.filter(story => 
    story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  const handleStorySelect = (storyId: string) => {
    const story = stories?.find(s => s.id === storyId);
    if (story) {
      const updated = {
        ...localData,
        passage_text: story.passage_text,
      };
      setLocalData(updated);
      onChange(updated);
      toast({
        title: 'Story Selected',
        description: `"${story.title}" has been loaded into the passage.`,
      });
    }
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
      {/* Story Library Selection */}
      <div className="p-4 border-2 border-dashed rounded-lg bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Select from AURA Library</Label>
        </div>
        
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stories by title, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loadingStories ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading library...
          </div>
        ) : (
          <Select onValueChange={handleStorySelect}>
            <SelectTrigger>
              <SelectValue placeholder={`Choose from ${stories?.length || 0} stories...`} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {filteredStories.map((story) => (
                <SelectItem key={story.id} value={story.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{story.title}</span>
                    <span className="text-xs text-muted-foreground">
                      Grade {story.grade_level} • {story.category} • {story.word_count} words
                    </span>
                  </div>
                </SelectItem>
              ))}
              {filteredStories.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No stories found. Try a different search.
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-1/2 border-t border-muted-foreground/20" />
        <div className="relative flex justify-center">
          <span className="bg-background px-2 text-sm text-muted-foreground">or paste/type manually</span>
        </div>
      </div>

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