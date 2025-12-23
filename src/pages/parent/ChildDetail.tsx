import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mic, FileText, TrendingUp, Trophy, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { StudentBehaviorHistory } from "@/components/behavior/StudentBehaviorHistory";
import { ParentWeeklyReport } from "@/components/parent/ParentWeeklyReport";
import { useAuth } from "@/contexts/AuthContext";

interface AuraRecord {
  id: string;
  created_at: string;
  grade: number | null;
  clarity: number;
  confidence: number;
  wpm: number;
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Core child info query - lightweight, cached
  const { data: childData, isLoading: childLoading } = useQuery({
    queryKey: ["parent-child-info", user?.id, studentId],
    queryFn: async () => {
      if (!user?.id || !studentId) return null;

      const { data, error } = await supabase.rpc("get_parent_child_info", {
        _parent_user_id: user.id,
        _student_id: studentId,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        full_name: data[0].full_name,
        email: data[0].email,
      };
    },
    enabled: !!user?.id && !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Classroom query - needed for behavior tab
  const { data: classroomId } = useQuery({
    queryKey: ["student-classroom", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await supabase
        .from("classroom_students")
        .select("classroom_id")
        .eq("student_id", studentId)
        .limit(1)
        .maybeSingle();
      return data?.classroom_id || null;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  // Parent account query - cached
  const { data: parentAccount } = useQuery({
    queryKey: ["parent-account", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      let { data, error } = await supabase
        .from("parent_accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Create if not exists
      if (!data) {
        const { data: newAccount, error: createError } = await supabase
          .from("parent_accounts")
          .insert({
            user_id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.email || "Parent",
          })
          .select("id")
          .single();

        if (createError) throw createError;
        return newAccount;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
  });

  // Consents query
  const { data: consents, refetch: refetchConsents } = useQuery({
    queryKey: ["parent-consents", parentAccount?.id, studentId],
    queryFn: async () => {
      if (!parentAccount?.id || !studentId) return null;

      const { data } = await supabase
        .from("parent_consents")
        .select("*")
        .eq("parent_id", parentAccount.id)
        .eq("student_id", studentId)
        .maybeSingle();

      return data;
    },
    enabled: !!parentAccount?.id && !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  const auraConsent = consents?.aura_recording_consent ?? false;
  const assignmentConsent = consents?.assignment_data_consent ?? false;

  // AURA records query - only when consent given
  const { data: auraRecords = [], isLoading: auraLoading } = useQuery({
    queryKey: ["student-aura-records", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await supabase
        .from("aura_records")
        .select("id, created_at, grade, clarity, confidence, wpm")
        .eq("profile_id", studentId)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data as AuraRecord[]) || [];
    },
    enabled: !!studentId && auraConsent,
    staleTime: 2 * 60 * 1000,
  });

  // Assignments query
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["student-assignments", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await supabase
        .from("assignment_submissions")
        .select("id, submitted_at, grade, teacher_feedback, assignments(title)")
        .eq("student_id", studentId)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false })
        .limit(10);

      return (
        data?.map((s: any) => ({
          id: s.id,
          title: s.assignments?.title || "Untitled",
          submitted_at: s.submitted_at,
          grade: s.grade,
          teacher_feedback: s.teacher_feedback,
        })) || []
      );
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Redirect if no access
  useEffect(() => {
    if (!childLoading && !childData && studentId) {
      toast.error("Child not found or access denied");
      navigate("/parent/dashboard");
    }
  }, [childLoading, childData, studentId, navigate]);

  const updateConsent = async (type: "aura" | "assignment", value: boolean) => {
    if (!parentAccount?.id || !studentId) return;

    const field = type === "aura" ? "aura_recording_consent" : "assignment_data_consent";

    try {
      const { data: existing } = await supabase
        .from("parent_consents")
        .select("id")
        .eq("parent_id", parentAccount.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("parent_consents")
          .update({ [field]: value, consent_date: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("parent_consents").insert({
          parent_id: parentAccount.id,
          student_id: studentId,
          [field]: value,
          aura_recording_consent: type === "aura" ? value : false,
          assignment_data_consent: type === "assignment" ? value : false,
        });
      }

      toast.success("Consent granted");
      refetchConsents();
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["student-aura-records", studentId] });
    } catch (error) {
      toast.error("Error updating consent");
    }
  };

  // Always render shell immediately - use skeletons for loading states
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
          {childLoading ? (
            <>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-32" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{childData?.full_name}</h1>
              <p className="text-muted-foreground">{childData?.email}</p>
            </>
          )}
        </div>

        <Tabs defaultValue="reading" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="reading" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Reading Progress
            </TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="aura">AURA Details</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="consents">Consents</TabsTrigger>
          </TabsList>

          <TabsContent value="reading">
            {!auraConsent ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    Enable AURA Recording Consent to view reading progress
                  </p>
                  <Button onClick={() => updateConsent("aura", true)}>
                    Enable Reading Data
                  </Button>
                </CardContent>
              </Card>
            ) : studentId ? (
              <ParentWeeklyReport
                studentId={studentId}
                studentName={childData?.full_name || "Your child"}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="consents">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Consents (FERPA/COPPA)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>AURA Recording Consent</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow collection of speech recordings for AI analysis
                    </p>
                  </div>
                  {auraConsent ? (
                    <span className="text-sm text-muted-foreground font-medium">Allowed</span>
                  ) : (
                    <Button onClick={() => updateConsent("aura", true)}>Allow</Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Assignment Data Consent</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow collection of assignment submissions and grades
                    </p>
                  </div>
                  {assignmentConsent ? (
                    <span className="text-sm text-muted-foreground font-medium">Allowed</span>
                  ) : (
                    <Button onClick={() => updateConsent("assignment", true)}>Allow</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            {studentId && classroomId ? (
              <StudentBehaviorHistory studentId={studentId} classroomId={classroomId} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No classroom data available</p>
                </CardContent>
              </Card>
            )}
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
            ) : auraLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                        <Badge variant={record.grade && record.grade >= 80 ? "default" : "secondary"}>
                          Grade: {record.grade}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Reading Speed</p>
                          <p className="font-semibold">{record.wpm} WPM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clarity</p>
                          <p className="font-semibold">{Math.round(record.clarity)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-semibold">{Math.round(record.confidence)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments">
            {assignmentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : assignments.length === 0 ? (
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
