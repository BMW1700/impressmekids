import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Clock, 
  FileText,
  Sparkles,
  Heart
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ParentStoryBankProps {
  parentUserId: string;
  children: Array<{ student_id: string; full_name: string }>;
}

const CATEGORIES = [
  { value: "animals", label: "Animals" },
  { value: "space", label: "Space" },
  { value: "sports", label: "Sports" },
  { value: "fairy_tales", label: "Fairy Tales" },
  { value: "science", label: "Science" },
  { value: "adventure", label: "Adventure" },
  { value: "history", label: "History" },
  { value: "other", label: "Other" },
];

const GRADE_LEVELS = [
  { value: "0", label: "Kindergarten" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
];

const GRADIENTS = [
  "from-purple-400 to-pink-500",
  "from-blue-400 to-cyan-500",
  "from-green-400 to-emerald-500",
  "from-amber-400 to-orange-500",
  "from-red-400 to-rose-500",
  "from-indigo-400 to-purple-500",
  "from-teal-400 to-cyan-500",
];

export const ParentStoryBank = ({ parentUserId, children }: ParentStoryBankProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passageText, setPassageText] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [category, setCategory] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const queryClient = useQueryClient();

  // Fetch parent's submitted stories
  const { data: stories, isLoading } = useQuery({
    queryKey: ["parent-stories", parentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_stories")
        .select("*")
        .eq("submitted_by", parentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!parentUserId,
  });

  // Submit story mutation
  const submitStory = useMutation({
    mutationFn: async () => {
      const wordCount = passageText.trim().split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 150));
      const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

      const { error } = await supabase.from("parent_stories").insert({
        submitted_by: parentUserId,
        for_student_id: selectedChild,
        title: title.trim(),
        description: description.trim() || null,
        passage_text: passageText.trim(),
        grade_level: parseInt(gradeLevel),
        category,
        source_note: sourceNote.trim() || null,
        word_count: wordCount,
        reading_time_minutes: readingTime,
        cover_gradient: randomGradient,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Story submitted! 📚",
        description: "Your story is now available for your child in LexiQuest.",
      });
      queryClient.invalidateQueries({ queryKey: ["parent-stories", parentUserId] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error submitting story:", error);
      toast({
        title: "Error",
        description: "Failed to submit story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete story mutation
  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from("parent_stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Story deleted",
        description: "The story has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["parent-stories", parentUserId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete story.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedChild("");
    setTitle("");
    setDescription("");
    setPassageText("");
    setGradeLevel("");
    setCategory("");
    setSourceNote("");
  };

  const wordCount = passageText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = selectedChild && title.trim() && passageText.trim().length >= 50 && gradeLevel && category;

  const getChildName = (studentId: string) => {
    const child = children.find(c => c.student_id === studentId);
    return child?.full_name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Story Bank
          </h3>
          <p className="text-sm text-muted-foreground">
            Add custom stories for your child's reading practice
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Story
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add a Story for Your Child
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Child selector */}
              <div className="space-y-2">
                <Label htmlFor="child">For which child?</Label>
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.student_id} value={child.student_id}>
                        {child.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Story Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., The Magic Garden"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Short Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="A brief summary of the story..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Grade Level and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Story Text */}
              <div className="space-y-2">
                <Label htmlFor="passage">Story Text</Label>
                <Textarea
                  id="passage"
                  placeholder="Paste your story here... (Tip: Use ChatGPT to generate age-appropriate stories!)"
                  value={passageText}
                  onChange={(e) => setPassageText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>~{Math.max(1, Math.ceil(wordCount / 150))} min read</span>
                </div>
                {passageText.length > 0 && passageText.length < 50 && (
                  <p className="text-xs text-destructive">
                    Story must be at least 50 characters
                  </p>
                )}
              </div>

              {/* Source Note */}
              <div className="space-y-2">
                <Label htmlFor="source">Source (optional)</Label>
                <Input
                  id="source"
                  placeholder="e.g., ChatGPT, Original, Adapted from book"
                  value={sourceNote}
                  onChange={(e) => setSourceNote(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => submitStory.mutate()}
                disabled={!canSubmit || submitStory.isPending}
                className="w-full"
                variant="gradient"
              >
                {submitStory.isPending ? "Submitting..." : "Add Story to Library"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                <Heart className="h-3 w-3 inline mr-1" />
                This story will only be visible to {selectedChild ? getChildName(selectedChild) : "your child"}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stories List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading stories...
        </div>
      ) : stories && stories.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story: any) => (
            <Card key={story.id} className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${story.cover_gradient}`} />
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{story.title}</h4>
                    {story.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {story.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        Grade {story.grade_level === 0 ? "K" : story.grade_level}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {story.category.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {story.word_count} words
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {story.reading_time_minutes} min
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      For: <span className="font-medium">{getChildName(story.for_student_id)}</span>
                      {story.source_note && (
                        <span className="ml-2">• Source: {story.source_note}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => deleteStory.mutate(story.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="font-semibold text-lg mb-2">No stories yet</h4>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Add custom stories for your child's reading practice. You can use ChatGPT to generate 
              age-appropriate stories, then paste them here!
            </p>
            <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Story
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
