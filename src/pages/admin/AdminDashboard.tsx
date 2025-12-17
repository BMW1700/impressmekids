import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, GraduationCap, Shield, Calendar, Settings } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { TeacherListCard } from "@/components/admin/TeacherListCard";
import { StudentListCard } from "@/components/admin/StudentListCard";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { TeacherClassroomsList } from "@/components/admin/TeacherClassroomsList";
import { ClassroomStudentsList } from "@/components/admin/ClassroomStudentsList";
import { StudentClassroomsList } from "@/components/admin/StudentClassroomsList";
import { StudentParentsList } from "@/components/admin/StudentParentsList";
import { ParentAccessRequestsList } from "@/components/admin/ParentAccessRequestsList";
import { BackupManagement } from "@/components/admin/BackupManagement";
import { SchoolEventManager } from "@/components/admin/SchoolEventManager";
import { BulkStudentImport } from "@/components/admin/BulkStudentImport";
import { AccountVerificationRequests } from "@/components/admin/AccountVerificationRequests";
import { CleverSyncPanel } from "@/components/admin/CleverSyncPanel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { teachers, students, admins, isLoading } = useAdminData();

  // Teacher classrooms modal state
  const [teacherClassroomsOpen, setTeacherClassroomsOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedTeacherName, setSelectedTeacherName] = useState("");

  // Classroom students modal state
  const [classroomStudentsOpen, setClassroomStudentsOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [selectedClassroomName, setSelectedClassroomName] = useState("");

  // Student classrooms modal state
  const [studentClassroomsOpen, setStudentClassroomsOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  // Student parents modal state
  const [studentParentsOpen, setStudentParentsOpen] = useState(false);
  const [selectedStudentIdForParents, setSelectedStudentIdForParents] = useState<string | null>(null);
  const [selectedStudentNameForParents, setSelectedStudentNameForParents] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (userRole?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      // Note: Admins are always verified - no verification check needed
      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleViewTeacherClassrooms = (teacherId: string, teacherName: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedTeacherName(teacherName);
    setTeacherClassroomsOpen(true);
  };

  const handleViewClassroomStudents = (classroomId: string, classroomName: string) => {
    setSelectedClassroomId(classroomId);
    setSelectedClassroomName(classroomName);
    setClassroomStudentsOpen(true);
  };

  const handleViewStudentClassrooms = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setStudentClassroomsOpen(true);
  };

  const handleViewStudentParents = (studentId: string, studentName: string) => {
    setSelectedStudentIdForParents(studentId);
    setSelectedStudentNameForParents(studentName);
    setStudentParentsOpen(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black text-gradient-purple">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Platform-wide user management and oversight
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
                <div className="icon-circle-blue w-10 h-10">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{teachers?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total teachers on platform</p>
              </CardContent>
            </Card>

            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
                <div className="icon-circle-green w-10 h-10">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{students?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total students enrolled</p>
              </CardContent>
            </Card>

            <Card variant="glass" className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                <div className="icon-circle-purple w-10 h-10">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black">{admins?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Platform administrators</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="teachers" className="space-y-4">
            <div className="space-y-2">
              {/* Row 1: Teachers, Students, Admins, Teacher Requests, Parent Requests */}
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="teacher-requests">Account Requests</TabsTrigger>
                <TabsTrigger value="parent-requests">Parent Requests</TabsTrigger>
              </TabsList>
              {/* Row 2: Import, Clever, Calendar, Safety, Backups */}
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="import">Import</TabsTrigger>
                <TabsTrigger value="clever">Clever</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="safety">Safety</TabsTrigger>
                <TabsTrigger value="backups">Backups</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="teacher-requests" className="space-y-4">
              <AccountVerificationRequests />
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Teachers</CardTitle>
                  <CardDescription>
                    Manage and view all teachers on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!teachers || teachers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No teachers found</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {teachers.map((teacher) => (
                        <TeacherListCard
                          key={teacher.id}
                          teacher={teacher}
                          onViewClassrooms={handleViewTeacherClassrooms}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Students</CardTitle>
                  <CardDescription>
                    Manage and view all students on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!students || students.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No students found</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {students.map((student) => (
                        <StudentListCard
                          key={student.id}
                          student={student}
                          onViewClassrooms={handleViewStudentClassrooms}
                          onViewParents={handleViewStudentParents}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Admins</CardTitle>
                  <CardDescription>
                    View all platform administrators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!admins || admins.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No admins found</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {admins.map((admin) => (
                        <AdminListCard key={admin.id} admin={admin} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <BulkStudentImport />
            </TabsContent>

            <TabsContent value="clever" className="space-y-4">
              <CleverSyncPanel />
            </TabsContent>

            <TabsContent value="parent-requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Parent Access Requests</CardTitle>
                  <CardDescription>
                    Review and approve parent requests to access student data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParentAccessRequestsList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Safety Dashboard</CardTitle>
                  <CardDescription>
                    Navigate to the full safety dashboard to manage alerts and drills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/admin/safety")} className="w-full">
                    Open Safety Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backups" className="space-y-4">
              <BackupManagement />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    School Calendar Management
                  </CardTitle>
                  <CardDescription>
                    Manage school-wide events, holidays, and calendar settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SchoolEventManager />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <TeacherClassroomsList
        open={teacherClassroomsOpen}
        onClose={() => setTeacherClassroomsOpen(false)}
        teacherId={selectedTeacherId}
        teacherName={selectedTeacherName}
        onViewStudents={handleViewClassroomStudents}
      />

      <ClassroomStudentsList
        open={classroomStudentsOpen}
        onClose={() => setClassroomStudentsOpen(false)}
        classroomId={selectedClassroomId}
        classroomName={selectedClassroomName}
      />

      <StudentClassroomsList
        open={studentClassroomsOpen}
        onClose={() => setStudentClassroomsOpen(false)}
        studentId={selectedStudentId}
        studentName={selectedStudentName}
      />

      <StudentParentsList
        open={studentParentsOpen}
        onClose={() => setStudentParentsOpen(false)}
        studentId={selectedStudentIdForParents}
        studentName={selectedStudentNameForParents}
      />
    </div>
  );
}
