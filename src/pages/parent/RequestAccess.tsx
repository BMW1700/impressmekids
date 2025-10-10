import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const RequestAccess = () => {
  const [loading, setLoading] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }

      // Get parent account
      const { data: parentAccount } = await supabase
        .from("parent_accounts")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!parentAccount) {
        toast.error("Parent account not found");
        return;
      }

      // Find student by email
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", childEmail.trim())
        .single();

      if (!studentProfile) {
        toast.error("Student not found with this email");
        setLoading(false);
        return;
      }

      if (studentProfile.role !== "student") {
        toast.error("This email does not belong to a student account");
        setLoading(false);
        return;
      }

      // Check if link already exists
      const { data: existingLink } = await supabase
        .from("parent_student_links")
        .select("*")
        .eq("parent_id", parentAccount.id)
        .eq("student_id", studentProfile.id)
        .maybeSingle();

      if (existingLink) {
        toast.error("You already have a pending or approved link with this student");
        setLoading(false);
        return;
      }

      // Get student's classrooms and teachers
      const { data: classrooms } = await supabase
        .from("classroom_students")
        .select("classroom_id, classrooms(teacher_id)")
        .eq("student_id", studentProfile.id);

      if (!classrooms || classrooms.length === 0) {
        toast.error("Student is not enrolled in any classrooms");
        setLoading(false);
        return;
      }

      // Create access requests for each classroom
      const requests = classrooms.map((cs: any) => ({
        parent_id: parentAccount.id,
        student_id: studentProfile.id,
        classroom_id: cs.classroom_id,
        teacher_id: cs.classrooms.teacher_id,
        status: "pending",
        message: message || "Parent requesting access to view child's progress"
      }));

      const { error: requestError } = await supabase
        .from("parent_access_requests")
        .insert(requests);

      if (requestError) {
        console.error("Error creating requests:", requestError);
        toast.error("Error submitting access requests");
        setLoading(false);
        return;
      }

      // Create the parent-student link (will be approved by teacher)
      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_id: parentAccount.id,
          student_id: studentProfile.id,
          approved: false
        });

      if (linkError) {
        console.error("Error creating link:", linkError);
        toast.error("Error creating student link");
        setLoading(false);
        return;
      }

      toast.success("Access request sent! Waiting for teacher approval.");
      navigate("/parent/dashboard");

    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/parent/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Link Child Account</CardTitle>
            <CardDescription>
              Enter your child's email to request access to their progress. 
              Their teacher will need to approve the request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="childEmail">Child's Email</Label>
                <Input
                  id="childEmail"
                  type="email"
                  placeholder="student@school.edu"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Teacher (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Hello, I am [Child's Name]'s parent. I would like access to view their progress on Impress Me Kids."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  "Send Access Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default RequestAccess;
