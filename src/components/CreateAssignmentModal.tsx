import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, FileText, Eye, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAssignments } from "@/hooks/useAssignments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  onSuccess?: () => void;
}

export const CreateAssignmentModal = ({
  open,
  onOpenChange,
  classroomId,
  onSuccess
}: CreateAssignmentModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passageText, setPassageText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [enableRealtimeCoaching, setEnableRealtimeCoaching] = useState(false);
  const [isPosted, setIsPosted] = useState(true);
  const [category, setCategory] = useState<'Test' | 'Quiz' | 'Homework'>('Homework');
  const { toast } = useToast();
  const { createAssignment } = useAssignments(classroomId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsOcrProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        // Call OCR edge function
        const { data, error } = await supabase.functions.invoke('extract-text-from-image', {
          body: { image: base64Image }
        });

        if (error) {
          console.error('OCR error:', error);
          throw new Error(error.message || 'Failed to extract text from image');
        }

        if (data?.extracted_text) {
          setPassageText(data.extracted_text);
          setOcrConfidence(data.confidence || null);
          toast({
            title: "Text Extracted!",
            description: `Successfully extracted ${data.word_count} words from the image.`,
          });
        } else {
          throw new Error('No text could be extracted from the image');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };

    } catch (error: any) {
      console.error('Error processing image:', error);
      toast({
        title: "OCR Failed",
        description: error.message || "Could not extract text from image. Please try typing the passage manually.",
        variant: "destructive",
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !passageText.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please provide a title and passage text",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in");
      }

      const passageMetadata = {
        ocr_used: !!selectedFile,
        ocr_confidence: ocrConfidence,
        original_filename: selectedFile?.name,
      };

      createAssignment({
        classroomId,
        teacherId: session.user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        passageText: passageText.trim(),
        category,
        passageMetadata,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: isPosted ? 'published' : 'draft',
        enableRealtimeCoaching,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPassageText("");
      setDueDate("");
      setSelectedFile(null);
      setOcrConfidence(null);
      setPreviewMode(false);
      setEnableRealtimeCoaching(false);
      setIsPosted(true);
      setCategory('Homework');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Reading Comprehension Assignment</DialogTitle>
          <DialogDescription>
            Add a passage for students to read, highlight, and annotate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 'Chapter 5: Photosynthesis Reading'"
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for students..."
                disabled={isLoading}
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">
                <Calendar className="inline mr-2 h-4 w-4" />
                Due Date (Optional)
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Real-time Coaching Toggle */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="coaching-toggle" className="text-base font-medium">
                    Enable AI Reading Coach (AURA AI)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Students receive real-time AI feedback as they highlight and annotate the passage
                  </p>
                </div>
                <Switch
                  id="coaching-toggle"
                  checked={enableRealtimeCoaching}
                  onCheckedChange={setEnableRealtimeCoaching}
                  disabled={isLoading}
                />
              </div>
            </Card>

            {/* Post Assignment Toggle */}
            <Card className="p-4 bg-muted/30 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="post-toggle" className="text-base font-medium">
                    Post Assignment to Students
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isPosted ? "Students can see and complete this assignment" : "Save as draft - students won't see it yet"}
                  </p>
                </div>
                <Switch
                  id="post-toggle"
                  checked={isPosted}
                  onCheckedChange={setIsPosted}
                  disabled={isLoading}
                />
              </div>
            </Card>

            <div className="grid gap-2">
              <Label>Reading Passage</Label>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">
                    <FileText className="mr-2 h-4 w-4" />
                    Type/Paste Text
                  </TabsTrigger>
                  <TabsTrigger value="ocr">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image (OCR)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="mt-4">
                  <Textarea
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                    placeholder="Paste or type the reading passage here..."
                    disabled={isLoading}
                    rows={12}
                    className="font-serif text-base leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {passageText.length} characters, ~{Math.ceil(passageText.split(/\s+/).filter(w => w).length)} words
                  </p>
                </TabsContent>

                <TabsContent value="ocr" className="mt-4">
                  <Card className="p-6 border-2 border-dashed">
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium mb-1">Upload an image of the passage</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          AI will automatically extract the text
                        </p>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isLoading || isOcrProcessing}
                        className="max-w-xs"
                      />
                      {isOcrProcessing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Extracting text from image...
                        </div>
                      )}
                      {ocrConfidence && (
                        <p className="text-xs text-green-600">
                          ✓ Text extracted with {Math.round(ocrConfidence * 100)}% confidence
                        </p>
                      )}
                    </div>
                  </Card>

                  {passageText && (
                    <div className="mt-4">
                      <Label>Extracted Text (Editable)</Label>
                      <Textarea
                        value={passageText}
                        onChange={(e) => setPassageText(e.target.value)}
                        rows={12}
                        className="mt-2 font-serif text-base leading-relaxed"
                        placeholder="Extracted text will appear here..."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Review and edit the text if needed
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {passageText && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMode ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            )}

            {previewMode && passageText && (
              <Card className="p-6 bg-muted/30">
                <Label className="mb-2 block">Student View Preview</Label>
                <div className="prose prose-sm max-w-none font-serif text-base leading-relaxed whitespace-pre-wrap">
                  {passageText}
                </div>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !passageText.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPosted ? "Create & Post Assignment" : "Save as Draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
