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
import { useLanguage } from "@/contexts/LanguageContext";

const RequestAccess = () => {
  const { t } = useLanguage();
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

      // Find student by email securely (returns UUID directly)
      const { data: studentId, error: studentError } = await supabase
        .rpc('find_student_by_email_secure', { 
          p_email: childEmail.trim().toLowerCase() 
        });

      if (studentError || !studentId) {
        toast.error("Student not found with this email");
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
        toast.error("This email does not belong to a student account");
        setLoading(false);
        return;
      }

      // Check if link already exists
      const { data: existingLink } = await supabase
        .from("parent_student_links")
        .select("*")
        .eq("parent_id", parentAccount.id)
        .eq("student_id", studentId)
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
        .eq("student_id", studentId);

      if (!classrooms || classrooms.length === 0) {
        toast.error("Student is not enrolled in any classrooms");
        setLoading(false);
        return;
      }

      // Create access requests for each classroom
      const requests = classrooms.map((cs: any) => ({
        parent_id: parentAccount.id,
        student_id: studentId,
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

      toast.success(`Access request sent to ${classrooms.length} teacher(s)! Waiting for approval.`);
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
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/parent/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("parentRequestAccess.backToDashboard")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t("parentRequestAccess.title")}</CardTitle>
            <CardDescription>{t("parentRequestAccess.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="childEmail">{t("parentRequestAccess.childEmailLabel")}</Label>
                <Input
                  id="childEmail"
                  type="email"
                  placeholder={t("parentRequestAccess.childEmailPlaceholder")}
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("parentRequestAccess.messageLabel")}</Label>
                <Textarea
                  id="message"
                  placeholder={t("parentRequestAccess.messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("parentRequestAccess.sending")}
                  </>
                ) : (
                  t("parentRequestAccess.send")
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
