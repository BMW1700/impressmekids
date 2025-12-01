import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface ParentQuickMessagePanelProps {
  students: any[];
}

export function ParentQuickMessagePanel({ students }: ParentQuickMessagePanelProps) {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const templates = [
    { value: "behavior", label: "Behavior Concern", message: "I'd like to discuss my child's behavior in class." },
    { value: "health", label: "Health Issue", message: "My child is experiencing a health issue that may affect their participation." },
    { value: "pickup", label: "Early Pickup", message: "I need to pick up my child early today." },
    { value: "attendance", label: "Attendance Question", message: "I have a question about my child's attendance record." },
    { value: "praise", label: "Positive Feedback", message: "I wanted to share something positive about my child's progress." },
    { value: "question", label: "General Question", message: "" }
  ];

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
    const template = templates.find(t => t.value === value);
    if (template) {
      setCustomMessage(template.message);
    }
  };

  const handleSend = async () => {
    if (!selectedStudent || !customMessage) {
      toast({
        title: "Missing Information",
        description: "Please select a student and enter a message",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: parentAccount } = await supabase
        .from("parent_accounts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!parentAccount) throw new Error("Parent account not found");

      const { data: classroom } = await supabase
        .from("classroom_students")
        .select("classroom_id, classrooms(teacher_id)")
        .eq("student_id", selectedStudent)
        .limit(1)
        .single();

      if (!classroom) throw new Error("Student classroom not found");

      const { error } = await supabase.from("parent_teacher_messages").insert({
        parent_id: parentAccount.id,
        teacher_id: (classroom.classrooms as any).teacher_id,
        student_id: selectedStudent,
        message_text: customMessage,
        message_type: selectedTemplate || "general",
        subject: templates.find(t => t.value === selectedTemplate)?.label || "General Message",
        is_from_parent: true
      });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the teacher"
      });

      setCustomMessage("");
      setSelectedTemplate("");
      setSelectedStudent("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">Quick Message to Teacher</h3>
          <p className="text-sm text-muted-foreground">
            Send a message using a template or write your own
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Student</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.student_id} value={student.student_id}>
                  {(student.profiles as any).full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Message Template</label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your Message</label>
          <Textarea
            placeholder="Type your message here or select a template above..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={6}
          />
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </Card>
  );
}
