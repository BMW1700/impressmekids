import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClassroomCard } from "@/components/ClassroomCard";
import { CreateClassroomModal } from "@/components/CreateClassroomModal";
import { MLModelTraining } from "@/components/teacher/MLModelTraining";
import { AllStudentsDialog } from "@/components/teacher/AllStudentsDialog";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { TeacherLinksResourcesTab } from "@/components/teacher/TeacherLinksResourcesTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  Calendar as CalendarIcon,
  Loader2,
  PlusCircle,
  Sparkles,
  Users,
  Link,
} from "lucide-react";
import { liquidGlassTabClass } from "@/components/ui/liquid-glass-button";
import { Badge } from "@/components/ui/badge";
import { Directory } from "@/components/Directory";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherDashboardData, useTeacherAllStudents } from "@/hooks/useTeacherDashboardData";

const TeacherDashboard = () => {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const { 
    classrooms, 
    classroomsLoading, 
    studentCount, 
    activeAssignmentsCount,
    refetch: refetchDashboard
  } = useTeacherDashboardData();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Lazy load all students only when dialog opens
  const { data: classroomsWithStudents = [], refetch: loadAllStudents } = useTeacherAllStudents(classrooms);

  // Auth guards
  if (authLoading || classroomsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("teacherDashboard.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  if (profile.role !== "teacher") {
    navigate("/student/dashboard");
    return null;
  }

  if (!profile.is_verified) {
    navigate("/pending-verification");
    return null;
  }

  const formatWelcome = (name?: string) => {
    const template = t("teacherDashboard.welcome");
    return template.replace("{name}", name || "");
  };

  const handleOpenStudentsDialog = () => {
    loadAllStudents();
    setShowStudentsDialog(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showAuthButtons={false} onSignOut={handleSignOut} />

      <main className="flex-1 py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
              {formatWelcome(profile?.full_name ?? undefined)} <span className="text-[#9B6DD6]">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("teacherDashboard.subtitle")}
            </p>
          </div>

          {/* ML Spotlight Widget */}
          <Card className="mb-8 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">
                      {t("teacherDashboard.aiInsights.title")}
                    </h3>
                    <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t("teacherDashboard.aiInsights.badge")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t("teacherDashboard.aiInsights.description")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white"
                      onClick={() => navigate("/teacher/aura-analytics")}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t("teacherDashboard.aiInsights.viewAnalytics")}
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-card hover:bg-muted"
                      onClick={() => navigate("/teacher/aura-analytics")}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {t("teacherDashboard.aiInsights.atRiskStudents")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("teacherDashboard.stats.totalClassrooms")}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-primary">
                    {classrooms.length}
                  </span>
                  <span className="text-sm text-emerald-500 font-medium flex items-center gap-0.5">
                    ↗ {t("teacherDashboard.stats.activeLabel")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-card border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={handleOpenStudentsDialog}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("teacherDashboard.stats.totalStudents")}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-transparent">
                    {studentCount}
                  </span>
                  <span className="text-sm text-emerald-500 font-medium flex items-center gap-0.5">
                    ↗ {t("teacherDashboard.stats.enrolledLabel")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("teacherDashboard.stats.activeAssignments")}
                  </CardTitle>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black bg-gradient-to-b from-[#9B6DD6] to-[#D4A04A] bg-clip-text text-[#22c0c0]">
                    {activeAssignmentsCount}
                  </span>
                  <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400 border-0 text-xs">
                    {t("teacherDashboard.stats.mlPowered")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-auto p-2 bg-muted/50 rounded-xl gap-2">
              <TabsTrigger value="classrooms" className={liquidGlassTabClass}>
                <Users className="h-4 w-4 mr-2" />
                {t("teacherDashboard.tabs.classrooms")}
              </TabsTrigger>
              <TabsTrigger value="links-resources" className={liquidGlassTabClass}>
                <Link className="h-4 w-4 mr-2" />
                Links & Resources
              </TabsTrigger>
              <TabsTrigger value="calendar" className={liquidGlassTabClass}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t("teacherDashboard.tabs.calendar")}
              </TabsTrigger>
              <TabsTrigger value="directory" className={liquidGlassTabClass}>
                <Users className="h-4 w-4 mr-2" />
                {t("teacherDashboard.tabs.directory")}
              </TabsTrigger>
              <TabsTrigger value="actions" className={liquidGlassTabClass}>
                <BookOpen className="h-4 w-4 mr-2" />
                {t("teacherDashboard.tabs.quickActions")}
              </TabsTrigger>
              <TabsTrigger value="ml-training" className={liquidGlassTabClass}>
                <Brain className="h-4 w-4 mr-2" />
                {t("teacherDashboard.tabs.mlTraining")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classrooms" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{t("teacherDashboard.classrooms.title")}</h2>
                <Button
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("teacherDashboard.classrooms.create")}
                </Button>
              </div>

              {classrooms.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {t("teacherDashboard.classrooms.emptyTitle")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("teacherDashboard.classrooms.emptyDescription")}
                    </p>
                    <Button
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("teacherDashboard.classrooms.emptyCTA")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {classrooms.map((classroom: any) => (
                    <div
                      key={classroom.id}
                      onClick={() => navigate(`/classrooms/${classroom.id}`)}
                      className="cursor-pointer h-full"
                    >
                      <ClassroomCard
                        id={classroom.id}
                        name={classroom.name}
                        joinCode={classroom.join_code}
                        studentCount={classroom.student_count || 0}
                        createdAt={classroom.created_at}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="links-resources" className="mt-6">
              <TeacherLinksResourcesTab />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6 space-y-4">
              {user && <CalendarWidget userId={user.id} userRole="teacher" />}
            </TabsContent>

            <TabsContent value="directory" className="mt-6">
              <Directory />
            </TabsContent>

            <TabsContent value="actions" className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Browse Games */}
                <Card className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{t("teacherDashboard.quickActions.browseGames.title")}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t("teacherDashboard.quickActions.browseGames.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/games")}
                  >
                    {t("teacherDashboard.quickActions.browseGames.cta")} →
                  </Button>
                </Card>

                {/* AURA Analytics */}
                <Card className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{t("teacherDashboard.quickActions.auraAnalytics.title")}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t("teacherDashboard.quickActions.auraAnalytics.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/teacher/aura-analytics")}
                  >
                    {t("teacherDashboard.quickActions.auraAnalytics.cta")} →
                  </Button>
                </Card>

                {/* Story Library */}
                <Card className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{t("teacherDashboard.quickActions.storyLibrary.title")}</h3>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t("teacherDashboard.quickActions.storyLibrary.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/teacher/story-library")}
                  >
                    {t("teacherDashboard.quickActions.storyLibrary.cta")} →
                  </Button>
                </Card>

                {/* Resources */}
                <Card className="p-6 hover:shadow-lg transition-all opacity-75">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <h3 className="text-lg font-bold">{t("teacherDashboard.quickActions.resources.title")}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {t("teacherDashboard.quickActions.resources.soon")}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t("teacherDashboard.quickActions.resources.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    {t("teacherDashboard.quickActions.resources.cta")} →
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ml-training" className="mt-6">
              <MLModelTraining />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <CreateClassroomModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={refetchDashboard}
      />

      <AllStudentsDialog
        open={showStudentsDialog}
        onOpenChange={setShowStudentsDialog}
        classrooms={classroomsWithStudents}
        totalStudents={classroomsWithStudents.reduce((sum: number, c: any) => sum + (c.students?.length || 0), 0)}
      />
    </div>
  );
};

export default TeacherDashboard;
