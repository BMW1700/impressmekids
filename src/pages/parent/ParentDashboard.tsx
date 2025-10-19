import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, CheckCircle, Clock, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";
import { StudentClassroomCard } from "@/components/parent/StudentClassroomCard";
import { StudentLookupModal } from "@/components/parent/StudentLookupModal";
import { ParentNotificationBell } from "@/components/parent/ParentNotificationBell";

interface ClassroomInfo {
  id: string;
  name: string;
  teacher_name: string;
  teacher_id: string;
  average_grade: number | null;
  assignment_count: number;
  graded_assignment_count: number;
}

interface ChildLink {
  id: string;
  student_id: string;
  approved: boolean;
  requested_at: string;
  student: {
    full_name: string;
    email: string;
  };
  classrooms: ClassroomInfo[];
}

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if parent account exists
    const { data: parentAccount, error: parentError } = await supabase
      .from("parent_accounts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (parentError) {
      console.error("Error fetching parent account:", parentError);
      toast.error("Error loading parent account");
      return;
    }

    if (!parentAccount) {
      // Create parent account if it doesn't exist
      const { data: newParent, error: createError } = await supabase
        .from("parent_accounts")
        .insert({
          user_id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "Parent"
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating parent account:", createError);
        toast.error("Error creating parent account");
        return;
      }

      setParentId(newParent.id);
    } else {
      setParentId(parentAccount.id);
    }

    loadChildren(parentAccount?.id || "");
  };

  const loadChildren = async (pId: string) => {
    const { data, error } = await supabase
      .from("parent_student_links")
      .select(`
        id,
        student_id,
        approved,
        requested_at,
        student:student_id (
          full_name:profiles!inner(full_name),
          email:profiles!inner(email)
        )
      `)
      .eq("parent_id", pId)
      .order("requested_at", { ascending: false });

    if (error) {
      console.error("Error loading children:", error);
      toast.error("Error loading linked children");
      setLoading(false);
      return;
    }

    // Transform the basic data
    const transformed = await Promise.all(
      (data || []).map(async (link: any) => {
        const childLink: ChildLink = {
          id: link.id,
          student_id: link.student_id,
          approved: link.approved,
          requested_at: link.requested_at,
          student: {
            full_name: link.student[0]?.full_name || "Unknown",
            email: link.student[0]?.email || "Unknown"
          },
          classrooms: []
        };

        // Only fetch classroom data for approved links
        if (link.approved) {
          try {
            // Fetch classrooms for this student
            const { data: classroomData, error: classroomError } = await supabase
              .from("classroom_students")
              .select(`
                classroom_id,
                classrooms!inner (
                  id,
                  name,
                  teacher_id,
                  teacher:teacher_id (
                    full_name:profiles!inner(full_name)
                  )
                )
              `)
              .eq("student_id", link.student_id);

            if (classroomError) {
              console.error("Error loading classrooms:", classroomError);
            } else if (classroomData) {
              // For each classroom, fetch and calculate grades
              const classroomInfos = await Promise.all(
                classroomData.map(async (cs: any) => {
                  const classroom = cs.classrooms;
                  
                  // Fetch assignment submissions for this student in this classroom
                  const { data: submissions } = await supabase
                    .from("assignment_submissions")
                    .select(`
                      id,
                      grade,
                      status,
                      assignment_id,
                      assignments!inner (
                        id,
                        classroom_id
                      )
                    `)
                    .eq("student_id", link.student_id)
                    .eq("assignments.classroom_id", classroom.id);

                  const allSubmissions = submissions || [];
                  const gradedSubmissions = allSubmissions.filter(s => s.grade !== null);
                  
                  const averageGrade = gradedSubmissions.length > 0
                    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
                    : null;

                  return {
                    id: classroom.id,
                    name: classroom.name,
                    teacher_name: classroom.teacher[0]?.full_name || "Unknown Teacher",
                    teacher_id: classroom.teacher_id,
                    average_grade: averageGrade,
                    assignment_count: allSubmissions.length,
                    graded_assignment_count: gradedSubmissions.length,
                  };
                })
              );

              childLink.classrooms = classroomInfos;
            }
          } catch (err) {
            console.error("Error loading classroom data:", err);
          }
        }

        return childLink;
      })
    );

    setChildren(transformed);
    setLoading(false);
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
      <Header>
        {parentId && <ParentNotificationBell parentId={parentId} />}
      </Header>
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Parent Dashboard</h1>
            <p className="text-muted-foreground">View your children's progress</p>
          </div>
          <Button onClick={() => setLookupModalOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Student Lookup
          </Button>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Linked Children</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Link your child's account to view their progress and AURA recordings.
              </p>
              <Button onClick={() => navigate("/parent/request-access")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Link Child Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {children.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{link.student.full_name}</span>
                    {link.approved ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{link.student.email}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {link.approved ? (
                    <>
                      {link.classrooms.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            <span>Enrolled in {link.classrooms.length} {link.classrooms.length === 1 ? 'class' : 'classes'}</span>
                          </div>
                          <div className="space-y-2">
                            {link.classrooms.map((classroom) => (
                              <StudentClassroomCard
                                key={classroom.id}
                                classroomName={classroom.name}
                                teacherName={classroom.teacher_name}
                                currentGrade={classroom.average_grade}
                                assignmentCount={classroom.assignment_count}
                                gradedAssignmentCount={classroom.graded_assignment_count}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Not enrolled in any classes yet
                        </div>
                      )}
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/parent/child/${link.student_id}`)}
                      >
                        View Detailed Progress
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Waiting for teacher approval
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {parentId && (
          <StudentLookupModal
            open={lookupModalOpen}
            onOpenChange={setLookupModalOpen}
            parentId={parentId}
            onSuccess={() => loadChildren(parentId)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ParentDashboard;
