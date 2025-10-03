import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { FlashcardSetViewer } from "./FlashcardSetViewer";

interface GenerateFlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionGroupId: string;
  groupTitle: string;
  questionCount: number;
  onSuccess?: () => void;
}

export function GenerateFlashcardsModal({ 
  open, 
  onOpenChange, 
  questionGroupId,
  groupTitle,
  questionCount,
  onSuccess 
}: GenerateFlashcardsModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<any[]>([]);
  const [flashcardSetId, setFlashcardSetId] = useState<string | null>(null);
  const [title, setTitle] = useState(`${groupTitle} - Flashcards`);
  const [description, setDescription] = useState(`Flashcards generated from ${groupTitle}`);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGeneratedFlashcards([]);

      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { 
          question_group_id: questionGroupId,
          title,
          description 
        },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please try again in a moment.",
            variant: "destructive",
          });
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast({
            title: "AI Credits Depleted",
            description: "Please add credits to your account to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      setGeneratedFlashcards(data.flashcards);
      setFlashcardSetId(data.flashcard_set_id);

      toast({
        title: "Success",
        description: `Generated ${data.count} flashcards successfully`,
      });

    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setGeneratedFlashcards([]);
    setFlashcardSetId(null);
    setTitle(`${groupTitle} - Flashcards`);
    setDescription(`Flashcards generated from ${groupTitle}`);
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Flashcards with AI</DialogTitle>
        </DialogHeader>

        {generatedFlashcards.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                Generate flashcards from the {questionCount} questions in <strong>{groupTitle}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                AI will create study cards with clear questions and helpful explanations.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Flashcard Set Title</Label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || questionCount === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✓ Successfully generated {generatedFlashcards.length} flashcards
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Flashcard set has been saved and is ready to use
              </p>
            </div>

            <FlashcardSetViewer flashcards={generatedFlashcards} />

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}