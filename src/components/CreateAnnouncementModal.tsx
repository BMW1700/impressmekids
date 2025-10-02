import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
  onSuccess?: () => void;
}

export const CreateAnnouncementModal = ({
  open,
  onOpenChange,
  classroomId,
  onSuccess
}: CreateAnnouncementModalProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"announcement" | "assignment">("announcement");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Verify user is the teacher of this classroom
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', classroomId)
        .single();

      if (classroom?.teacher_id !== session.user.id) {
        toast({
          title: "Access Denied",
          description: "Only the classroom teacher can send announcements",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('classroom_announcements')
        .insert({
          classroom_id: classroomId,
          teacher_id: session.user.id,
          title: title.trim(),
          content: content.trim(),
          announcement_type: type,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${type === 'assignment' ? 'Assignment' : 'Announcement'} sent to all students`,
      });

      setTitle("");
      setContent("");
      setType("announcement");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send to Students</DialogTitle>
          <DialogDescription>
            Create an announcement or assignment for all students in this classroom
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value: "announcement" | "assignment") => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                disabled={isLoading}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your message..."
                disabled={isLoading}
                rows={6}
                maxLength={2000}
              />
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
