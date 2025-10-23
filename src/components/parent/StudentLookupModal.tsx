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
      // SECURITY: Use secure function to find student by email (returns UUID directly)
      const { data: studentId, error: profileError } = await supabase
        .rpc('find_student_by_email_secure', { 
          p_email: studentEmail.trim().toLowerCase() 
        });

      if (profileError) {
        console.error("Error finding student:", profileError);
        toast.error("Error looking up student");
        setLoading(false);
        return;
      }

      if (!studentId) {
        toast.error("The email entered is invalid. No student found with that email.");
        setLoading(false);
        return;
      }

      // Verify the user has student role using user_roles table
      const { data: roleCheck } = await supabase
        .rpc('has_role', { 
          _user_id: studentId, 
          _role: 'student' 
        });

      if (!roleCheck) {
        toast.error("The email provided is not associated with a student account.");
        setLoading(false);
        return;
      }

      // Get all classrooms the student is enrolled in
      const { data: classrooms, error: classroomError } = await supabase
        .from("classroom_students")
        .select("classroom_id, classrooms!inner(teacher_id)")
        .eq("student_id", studentId);

      if (classroomError) {
        console.error("Error fetching classrooms:", classroomError);
        toast.error("Error checking student enrollment");
        setLoading(false);
        return;
      }

      if (!classrooms || classrooms.length === 0) {
        toast.error("This student is not enrolled in any classrooms yet. Please contact their teacher.");
        setLoading(false);
        return;
      }

      // Check for existing requests
      const { data: existingRequests } = await supabase
        .from("parent_access_requests")
        .select("id, status")
        .eq("parent_id", parentId)
        .eq("student_id", studentId);

      if (existingRequests && existingRequests.some(req => req.status === 'pending')) {
        toast.info("Access requests for this student are already pending teacher approval.");
        setLoading(false);
        onOpenChange(false);
        return;
      }

      // Create access requests for each classroom (teacher approval required)
      const accessRequests = classrooms.map(classroom => ({
        parent_id: parentId,
        student_id: studentId,
        classroom_id: classroom.classroom_id,
        teacher_id: (classroom.classrooms as any).teacher_id,
        status: 'pending',
        message: `Parent requesting access to view ${studentName}'s academic progress`
      }));

      const { error: requestError } = await supabase
        .from("parent_access_requests")
        .insert(accessRequests);

      if (requestError) {
        console.error("Error creating access requests:", requestError);
        toast.error("Error submitting access requests");
        setLoading(false);
        return;
      }

      toast.success(`Access requests sent to ${classrooms.length} teacher(s)! Teachers will review and approve your request.`);
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
