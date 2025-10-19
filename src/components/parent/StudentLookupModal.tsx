import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StudentLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  onSuccess: () => void;
}

export const StudentLookupModal = ({ open, onOpenChange, parentId, onSuccess }: StudentLookupModalProps) => {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Find student by email
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("email", studentEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) {
        console.error("Error finding student:", profileError);
        toast.error("Error looking up student");
        setLoading(false);
        return;
      }

      if (!studentProfile) {
        toast.error("The email entered is invalid. No student found with that email.");
        setLoading(false);
        return;
      }

      // Verify the user has student role using user_roles table
      const { data: roleCheck } = await supabase
        .rpc('has_role', { 
          _user_id: studentProfile.id, 
          _role: 'student' 
        });

      if (!roleCheck) {
        toast.error("The email provided is not associated with a student account.");
        setLoading(false);
        return;
      }

      // Check if link already exists
      const { data: existingLink, error: linkCheckError } = await supabase
        .from("parent_student_links")
        .select("id, approved")
        .eq("parent_id", parentId)
        .eq("student_id", studentProfile.id)
        .maybeSingle();

      if (linkCheckError) {
        console.error("Error checking existing link:", linkCheckError);
        toast.error("Error checking student link");
        setLoading(false);
        return;
      }

      if (existingLink) {
        if (existingLink.approved) {
          toast.info("This student is already linked to your account.");
        } else {
          toast.info("A link request for this student is already pending approval.");
        }
        setLoading(false);
        onOpenChange(false);
        return;
      }

      // Create new parent_student_link with pending status
      const { error: insertError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_id: parentId,
          student_id: studentProfile.id,
          approved: false
        });

      if (insertError) {
        console.error("Error creating student link:", insertError);
        toast.error("Error creating student link");
        setLoading(false);
        return;
      }

      toast.success("Student link request submitted! Waiting for teacher approval.");
      setStudentName("");
      setStudentEmail("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Student Lookup</DialogTitle>
          <DialogDescription>
            Enter your student's full name and school email address to link their account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student's Full Name</Label>
            <Input
              id="studentName"
              placeholder="Enter student's full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="studentEmail">Student's School Email</Label>
            <Input
              id="studentEmail"
              type="email"
              placeholder="student@school.edu"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
