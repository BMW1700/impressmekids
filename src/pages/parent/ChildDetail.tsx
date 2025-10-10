import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Mic, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChildData {
  full_name: string;
  email: string;
}

interface AuraRecord {
  id: string;
  created_at: string;
  grade: number;
  pronunciation: number;
  clarity: number;
  confidence: number;
  pace: number;
}

interface Assignment {
  id: string;
  title: string;
  submitted_at: string;
  grade: number;
  teacher_feedback: string | null;
}

const ChildDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<ChildData | null>(null);
  const [auraRecords, setAuraRecords] = useState<AuraRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [auraConsent, setAuraConsent] = useState(false);
  const [assignmentConsent, setAssignmentConsent] = useState(false);

  useEffect(() => {
    loadChildData();
  }, [studentId]);

  const loadChildData = async () => {
    if (!studentId) return;

    // Get child profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", studentId)
      .single();

    if (profile) {
      setChild(profile);
    }

    // Get parent ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: parentAccount } = await supabase
      .from("parent_accounts")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!parentAccount) return;

    // Check consents
    const { data: consents } = await supabase
      .from("parent_consents")
      .select("*")
      .eq("parent_id", parentAccount.id)
      .eq("student_id", studentId)
      .maybeSingle();

    if (consents) {
      setAuraConsent(consents.aura_recording_consent);
      setAssignmentConsent(consents.assignment_data_consent);
    }

    // Load AURA records if consent given
    if (consents?.aura_recording_consent) {
      const { data: aura } = await supabase
        .from("aura_records")
        .select("id, created_at, grade, pronunciation, clarity, confidence, pace")
        .eq("profile_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (aura) setAuraRecords(aura as any);
    }

    // Load assignments
    const { data: subs } = await supabase
      .from("assignment_submissions")
      .select("id, submitted_at, grade, teacher_feedback, assignments(title)")
      .eq("student_id", studentId)
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(10);

    if (subs) {
      setAssignments(subs.map((s: any) => ({
        id: s.id,
        title: s.assignments?.title || "Untitled",
        submitted_at: s.submitted_at,
        grade: s.grade,
        teacher_feedback: s.teacher_feedback
      })));
    }

    setLoading(false);
  };

  const updateConsent = async (type: "aura" | "assignment", value: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: parentAccount } = await supabase
      .from("parent_accounts")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!parentAccount) return;

    const field = type === "aura" ? "aura_recording_consent" : "assignment_data_consent";

    // Check if consent record exists
    const { data: existing } = await supabase
      .from("parent_consents")
      .select("id")
      .eq("parent_id", parentAccount.id)
      .eq("student_id", studentId!)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await supabase
        .from("parent_consents")
        .update({ [field]: value, consent_date: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        toast.error("Error updating consent");
        return;
      }
    } else {
      // Insert
      const { error } = await supabase
        .from("parent_consents")
        .insert({
          parent_id: parentAccount.id,
          student_id: studentId!,
          [field]: value,
          aura_recording_consent: type === "aura" ? value : false,
          assignment_data_consent: type === "assignment" ? value : false
        });

      if (error) {
        toast.error("Error setting consent");
        return;
      }
    }

    if (type === "aura") {
      setAuraConsent(value);
    } else {
      setAssignmentConsent(value);
    }

    toast.success(`Consent ${value ? "granted" : "revoked"}`);
    loadChildData(); // Reload to fetch AURA records if consent was just granted
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/parent/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{child?.full_name}</h1>
          <p className="text-muted-foreground">{child?.email}</p>
        </div>

        <Tabs defaultValue="consents" className="space-y-6">
          <TabsList>
            <TabsTrigger value="consents">Privacy Consents</TabsTrigger>
            <TabsTrigger value="aura">AURA Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="consents">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Consents (FERPA/COPPA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="aura-consent">AURA Recording Consent</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow collection of speech recordings for AI analysis
                    </p>
                  </div>
                  <Switch
                    id="aura-consent"
                    checked={auraConsent}
                    onCheckedChange={(val) => updateConsent("aura", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="assignment-consent">Assignment Data Consent</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow collection of assignment submissions and grades
                    </p>
                  </div>
                  <Switch
                    id="assignment-consent"
                    checked={assignmentConsent}
                    onCheckedChange={(val) => updateConsent("assignment", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aura">
            {!auraConsent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Enable AURA Recording Consent to view speech progress
                  </p>
                </CardContent>
              </Card>
            ) : auraRecords.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No AURA recordings yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {auraRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{format(new Date(record.created_at), "PPP")}</span>
                        <Badge variant={record.grade >= 80 ? "default" : "secondary"}>
                          Grade: {record.grade}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Pronunciation</p>
                          <p className="font-semibold">{record.pronunciation}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clarity</p>
                          <p className="font-semibold">{record.clarity}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-semibold">{record.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pace</p>
                          <p className="font-semibold">{record.pace}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments submitted yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{assignment.title}</span>
                        {assignment.grade !== null && (
                          <Badge variant={assignment.grade >= 80 ? "default" : "secondary"}>
                            Grade: {assignment.grade}%
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Submitted {format(new Date(assignment.submitted_at), "PPP")}
                      </p>
                    </CardHeader>
                    {assignment.teacher_feedback && (
                      <CardContent>
                        <p className="text-sm">
                          <strong>Teacher Feedback:</strong> {assignment.teacher_feedback}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ChildDetail;
