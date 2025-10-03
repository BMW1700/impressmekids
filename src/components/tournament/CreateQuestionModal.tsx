import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Minus } from "lucide-react";
import { SUBJECTS, GRADES } from "@/lib/gradeUtils";

interface CreateQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  groupId?: string;
  onSuccess?: () => void;
}

export const CreateQuestionModal = ({
  open,
  onOpenChange,
  classroomId,
  groupId,
  onSuccess,
}: CreateQuestionModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    grade: "",
    question_type: "short_answer",
    question_text: "",
    answer_text: "",
    difficulty: "medium",
    explanation: "",
    image_url: "",
    audio_url: "",
  });
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.grade || !formData.question_text || !formData.answer_text) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const questionData: any = {
        classroom_id: classroomId,
        subject: formData.subject,
        grade: parseInt(formData.grade),
        question_type: formData.question_type,
        question_text: formData.question_text,
        answer_text: formData.answer_text,
        difficulty: formData.difficulty,
        explanation: formData.explanation || null,
        image_url: formData.image_url || null,
        audio_url: formData.audio_url || null,
        source: "manual",
        approved: true,
        created_by: session.user.id,
        group_id: groupId || null,
      };

      if (formData.question_type === "multiple_choice") {
        const validOptions = options.filter(opt => opt.text.trim());
        if (validOptions.length < 2) {
          toast({
            title: "Invalid Options",
            description: "Multiple choice questions need at least 2 options",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        questionData.options = validOptions;
      }

      const { error } = await supabase.from("questions").insert(questionData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question created successfully",
      });

      // Reset form
      setFormData({
        subject: "",
        grade: "",
        question_type: "short_answer",
        question_text: "",
        answer_text: "",
        difficulty: "medium",
        explanation: "",
        image_url: "",
        audio_url: "",
      });
      setOptions([{ id: "1", text: "" }, { id: "2", text: "" }]);

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating question:", error);
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { id: String(options.length + 1), text: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Question Manually</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade.value} value={String(grade.value)}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="question_type">Question Type *</Label>
              <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                  <SelectItem value="matching">Matching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_text">Question Text *</Label>
            <Textarea
              id="question_text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter the question..."
              rows={3}
              required
            />
          </div>

          {formData.question_type === "multiple_choice" && (
            <div className="space-y-2">
              <Label>Answer Options *</Label>
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="flex gap-2">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${option.id}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={options.length <= 2}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="answer_text">Correct Answer *</Label>
            <Input
              id="answer_text"
              value={formData.answer_text}
              onChange={(e) => setFormData({ ...formData, answer_text: e.target.value })}
              placeholder="Enter the correct answer..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Explain why this is the correct answer..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio_url">Audio URL (Optional)</Label>
              <Input
                id="audio_url"
                type="url"
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
