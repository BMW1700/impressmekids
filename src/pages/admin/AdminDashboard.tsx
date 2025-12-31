import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, GraduationCap, Shield, Calendar, Settings, School, Link, FileUp, Zap, Database, UserPlus, UserCheck } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
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
import { SchoolsManagementModal } from "@/components/admin/SchoolsManagementModal";
import { SchoolResourcesModal } from "@/components/admin/SchoolResourcesModal";
import { ConnectToSchoolDialog } from "@/components/admin/ConnectToSchoolDialog";
import { EditStudentIdDialog } from "@/components/admin/EditStudentIdDialog";
import { AdminSchoolSelector } from "@/components/admin/AdminSchoolSelector";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSchools } from "@/hooks/useSchools";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("teachers");
  
  // Determine admin type: District Admin has no school_id but has district_id
  const isDistrictAdmin = !profile?.school_id && !!profile?.district_id;
  
  // For data filtering, use district_id for District Admins
  const { teachers, students, admins, isLoading } = useAdminData(
    selectedSchoolId, 
    isDistrictAdmin ? profile?.district_id : null
  );
  const { schools } = useSchools(profile?.district_id);

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

  // Schools management modal state
  const [schoolsModalOpen, setSchoolsModalOpen] = useState(false);

  // School resources modal state
  const [schoolResourcesModalOpen, setSchoolResourcesModalOpen] = useState(false);

  // Connect to school dialog state
  const [connectSchoolOpen, setConnectSchoolOpen] = useState(false);
  const [connectSchoolUserId, setConnectSchoolUserId] = useState<string>("");
  const [connectSchoolUserName, setConnectSchoolUserName] = useState<string>("");
  const [connectSchoolCurrentId, setConnectSchoolCurrentId] = useState<string | null>(null);

  // Edit student ID dialog state
  const [editStudentIdOpen, setEditStudentIdOpen] = useState(false);
  const [editStudentIdUserId, setEditStudentIdUserId] = useState<string>("");
  const [editStudentIdUserName, setEditStudentIdUserName] = useState<string>("");
  const [editStudentIdCurrentNumber, setEditStudentIdCurrentNumber] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    checkAdminAccess();
  }, [authLoading, user]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userRole?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      // Set default school from profile for School Admins (locked to their school)
      // District Admins start with null (All Schools view)
      if (profile?.school_id) {
        setSelectedSchoolId(profile.school_id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
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

  const handleConnectToSchool = (userId: string, userName: string, currentSchoolId?: string | null) => {
    setConnectSchoolUserId(userId);
    setConnectSchoolUserName(userName);
    setConnectSchoolCurrentId(currentSchoolId || null);
    setConnectSchoolOpen(true);
  };

  const handleEditStudentId = (studentId: string, studentName: string, currentStudentIdNumber: string | null) => {
    setEditStudentIdUserId(studentId);
    setEditStudentIdUserName(studentName);
    setEditStudentIdCurrentNumber(currentStudentIdNumber);
    setEditStudentIdOpen(true);
  };

  // Only block on auth - let data load progressively
  if (authLoading || loading) {
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-black text-gradient-purple">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-lg">
                {selectedSchoolId ? "School-specific management" : "Platform-wide user management and oversight"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <AdminSchoolSelector 
                value={selectedSchoolId} 
                onChange={setSelectedSchoolId}
                isDistrictAdmin={isDistrictAdmin}
                districtId={profile?.district_id}
                lockedSchoolName={!isDistrictAdmin ? schools?.find(s => s.id === profile?.school_id)?.name : undefined}
              />
              {selectedSchoolId ? (
                <Button 
                  variant="outline" 
                  onClick={() => setSchoolResourcesModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  School Resources
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setSchoolsModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <School className="h-4 w-4" />
                  Schools
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
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
                <p className="text-xs text-muted-foreground">
                  Teachers in {selectedSchoolId ? "this school" : "your district"}
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Students in {selectedSchoolId ? "this school" : "your district"}
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Admins in {selectedSchoolId ? "this school" : "your district"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            {isMobile ? (
              /* Mobile: Dropdown selector */
              <Select value={currentTab} onValueChange={setCurrentTab}>
                <SelectTrigger className="w-full h-12 bg-muted/50 rounded-xl border-0">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {currentTab === "teachers" && <><Users className="h-4 w-4" />Teachers</>}
                      {currentTab === "students" && <><GraduationCap className="h-4 w-4" />Students</>}
                      {currentTab === "admins" && <><Shield className="h-4 w-4" />Admins</>}
                      {currentTab === "teacher-requests" && <><UserCheck className="h-4 w-4" />Account Requests</>}
                      {currentTab === "parent-requests" && <><UserPlus className="h-4 w-4" />Parental Linking</>}
                      {currentTab === "import" && <><FileUp className="h-4 w-4" />Import</>}
                      {currentTab === "clever" && <><Zap className="h-4 w-4" />Clever</>}
                      {currentTab === "calendar" && <><Calendar className="h-4 w-4" />Calendar</>}
                      {currentTab === "safety" && <><Shield className="h-4 w-4" />Safety</>}
                      {currentTab === "backups" && <><Database className="h-4 w-4" />Backups</>}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="teachers"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Teachers</div></SelectItem>
                  <SelectItem value="students"><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Students</div></SelectItem>
                  <SelectItem value="admins"><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Admins</div></SelectItem>
                  {!selectedSchoolId && (
                    <SelectItem value="teacher-requests"><div className="flex items-center gap-2"><UserCheck className="h-4 w-4" />Account Requests</div></SelectItem>
                  )}
                  <SelectItem value="parent-requests"><div className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Parental Linking</div></SelectItem>
                  {!selectedSchoolId && (
                    <>
                      <SelectItem value="import"><div className="flex items-center gap-2"><FileUp className="h-4 w-4" />Import</div></SelectItem>
                      <SelectItem value="clever"><div className="flex items-center gap-2"><Zap className="h-4 w-4" />Clever</div></SelectItem>
                    </>
                  )}
                  <SelectItem value="calendar"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Calendar</div></SelectItem>
                  <SelectItem value="safety"><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Safety</div></SelectItem>
                  {!selectedSchoolId && (
                    <SelectItem value="backups"><div className="flex items-center gap-2"><Database className="h-4 w-4" />Backups</div></SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              /* Desktop: Tab lists */
              <div className="space-y-2">
                {selectedSchoolId ? (
                  <>
                    {/* School-specific view: Row 1 - Teachers, Students, Admins */}
                    <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                      <TabsTrigger value="teachers" className={liquidGlassTabClass}>Teachers</TabsTrigger>
                      <TabsTrigger value="students" className={liquidGlassTabClass}>Students</TabsTrigger>
                      <TabsTrigger value="admins" className={liquidGlassTabClass}>Admins</TabsTrigger>
                    </TabsList>
                    {/* School-specific view: Row 2 - Parental Linking, Calendar, Safety */}
                    <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                      <TabsTrigger value="parent-requests" className={liquidGlassTabClass}>Parental Linking</TabsTrigger>
                      <TabsTrigger value="calendar" className={liquidGlassTabClass}>Calendar</TabsTrigger>
                      <TabsTrigger value="safety" className={liquidGlassTabClass}>Safety</TabsTrigger>
                    </TabsList>
                  </>
                ) : (
                  <>
                    {/* All Schools view: Row 1 - Teachers, Students, Admins, Account Requests, Parental Linking */}
                    <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                      <TabsTrigger value="teachers" className={liquidGlassTabClass}>Teachers</TabsTrigger>
                      <TabsTrigger value="students" className={liquidGlassTabClass}>Students</TabsTrigger>
                      <TabsTrigger value="admins" className={liquidGlassTabClass}>Admins</TabsTrigger>
                      <TabsTrigger value="teacher-requests" className={liquidGlassTabClass}>Account Requests</TabsTrigger>
                      <TabsTrigger value="parent-requests" className={liquidGlassTabClass}>Parental Linking</TabsTrigger>
                    </TabsList>
                    {/* All Schools view: Row 2 - Import, Clever, Calendar, Safety, Backups */}
                    <TabsList className="grid w-full grid-cols-5 h-auto p-2 bg-muted/50 rounded-xl gap-2">
                      <TabsTrigger value="import" className={liquidGlassTabClass}>Import</TabsTrigger>
                      <TabsTrigger value="clever" className={liquidGlassTabClass}>Clever</TabsTrigger>
                      <TabsTrigger value="calendar" className={liquidGlassTabClass}>Calendar</TabsTrigger>
                      <TabsTrigger value="safety" className={liquidGlassTabClass}>Safety</TabsTrigger>
                      <TabsTrigger value="backups" className={liquidGlassTabClass}>Backups</TabsTrigger>
                    </TabsList>
                  </>
                )}
              </div>
            )}


            {!selectedSchoolId && (
              <TabsContent value="teacher-requests" className="space-y-4">
                <AccountVerificationRequests />
              </TabsContent>
            )}

            <TabsContent value="teachers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedSchoolId ? "School Teachers" : "All Teachers"}</CardTitle>
                  <CardDescription>
                    Manage and view {selectedSchoolId ? "teachers at this school" : "all teachers on the platform"}
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
                          onConnectToSchool={handleConnectToSchool}
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
                  <CardTitle>{selectedSchoolId ? "School Students" : "All Students"}</CardTitle>
                  <CardDescription>
                    Manage and view {selectedSchoolId ? "students at this school" : "all students on the platform"}
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
                          onConnectToSchool={handleConnectToSchool}
                          onEditStudentId={handleEditStudentId}
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
                  <CardTitle>{selectedSchoolId ? "School Admins" : "All Admins"}</CardTitle>
                  <CardDescription>
                    View {selectedSchoolId ? "administrators at this school" : "all platform administrators"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!admins || admins.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No admins found</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {admins.map((admin) => (
                        <AdminListCard 
                          key={admin.id} 
                          admin={admin}
                          onConnectToSchool={handleConnectToSchool}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parent-requests" className="space-y-4">
              <ParentAccessRequestsList schoolId={selectedSchoolId} />
            </TabsContent>

            {!selectedSchoolId && (
              <>
                <TabsContent value="import" className="space-y-4">
                  <BulkStudentImport />
                </TabsContent>

                <TabsContent value="clever" className="space-y-4">
                  <CleverSyncPanel />
                </TabsContent>

                <TabsContent value="backups" className="space-y-4">
                  <BackupManagement />
                </TabsContent>
              </>
            )}

            <TabsContent value="calendar" className="space-y-4">
              <SchoolEventManager />
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Safety Dashboard</CardTitle>
                  <CardDescription>
                    Monitor safety drills and emergency protocols
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => navigate("/admin/safety")} className="w-full sm:w-auto">
                      <Shield className="mr-2 h-4 w-4" />
                      Open Safety Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/admin/security")} className="w-full sm:w-auto">
                      View Security Settings
                    </Button>
                  </div>
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

      <SchoolsManagementModal
        open={schoolsModalOpen}
        onClose={() => setSchoolsModalOpen(false)}
      />

      {selectedSchoolId && (
        <SchoolResourcesModal
          open={schoolResourcesModalOpen}
          onClose={() => setSchoolResourcesModalOpen(false)}
          schoolId={selectedSchoolId}
        />
      )}

      <ConnectToSchoolDialog
        open={connectSchoolOpen}
        onClose={() => setConnectSchoolOpen(false)}
        userId={connectSchoolUserId}
        userName={connectSchoolUserName}
        currentSchoolId={connectSchoolCurrentId}
      />

      <EditStudentIdDialog
        open={editStudentIdOpen}
        onOpenChange={setEditStudentIdOpen}
        studentId={editStudentIdUserId}
        studentName={editStudentIdUserName}
        currentStudentIdNumber={editStudentIdCurrentNumber}
      />
    </div>
  );
}
