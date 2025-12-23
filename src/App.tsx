import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { OfflineIndicator } from "@/components/safety/OfflineIndicator";
import { MLStatusProvider } from "@/components/ml/MLStatusProvider";
import { SentryUserTracker } from "@/components/auth/SentryUserTracker";
import { Loader2 } from "lucide-react";

// Eagerly loaded critical routes
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for code splitting
const PendingVerification = lazy(() => import("./pages/PendingVerification"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCalendar = lazy(() => import("./pages/admin/AdminCalendar"));
const SchoolSettings = lazy(() => import("./pages/admin/SchoolSettings"));
const AdminSafetyDashboard = lazy(() => import("./pages/admin/AdminSafetyDashboard"));
const AdminDrillMonitor = lazy(() => import("./pages/admin/AdminDrillMonitor"));
const AdminSecurityDashboard = lazy(() => import("./pages/admin/AdminSecurityDashboard"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherCalendar = lazy(() => import("./pages/teacher/Calendar"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const AuraPractice = lazy(() => import("./pages/student/AuraPractice"));
const Calendar = lazy(() => import("./pages/student/Calendar"));
const Games = lazy(() => import("./pages/Games"));
const JeopardyGame = lazy(() => import("./pages/games/JeopardyGame"));
const NumberMaker = lazy(() => import("./pages/games/NumberMaker"));
const NameThatAnimalGame = lazy(() => import("./pages/games/NameThatAnimalGame"));
const USStatesMapQuiz = lazy(() => import("./pages/games/USStatesMapQuiz"));
const JoinClass = lazy(() => import("./pages/JoinClass"));
const ClassroomDetail = lazy(() => import("./pages/classrooms/ClassroomDetail"));
const QuestionsLibrary = lazy(() => import("./pages/teacher/QuestionsLibrary"));
const QuestionGroupDetail = lazy(() => import("./pages/teacher/QuestionGroupDetail"));
const TournamentControl = lazy(() => import("./pages/teacher/TournamentControl"));
const AuraAnalytics = lazy(() => import("./pages/teacher/AuraAnalytics"));
const ReadingAssignment = lazy(() => import("./pages/student/ReadingAssignment"));
const CompleteAssignment = lazy(() => import("./pages/student/CompleteAssignment"));
const ReviewSubmission = lazy(() => import("./pages/teacher/ReviewSubmission"));
const ReviewMultiQuestionSubmission = lazy(() => import("./pages/teacher/ReviewMultiQuestionSubmission"));
const ReviewMySubmission = lazy(() => import("./pages/student/ReviewMySubmission"));
const ReviewMyAnnotations = lazy(() => import("./pages/student/ReviewMyAnnotations"));
const CreateMultiQuestionAssignment = lazy(() => import("./pages/teacher/CreateMultiQuestionAssignment"));
const StudentProfile = lazy(() => import("./pages/teacher/StudentProfile"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentCalendar = lazy(() => import("./pages/parent/ParentCalendar"));
const RequestAccess = lazy(() => import("./pages/parent/RequestAccess"));
const NotificationSettings = lazy(() => import("./pages/parent/NotificationSettings"));
const ChildDetail = lazy(() => import("./pages/parent/ChildDetail"));
const ParentSafety = lazy(() => import("./pages/parent/ParentSafety"));
const ParentReviewSubmission = lazy(() => import("./pages/parent/ParentReviewSubmission"));
const ParentReviewAnnotations = lazy(() => import("./pages/parent/ParentReviewAnnotations"));
const PWAInstallGuide = lazy(() => import("./pages/parent/PWAInstallGuide"));
const DistrictDashboard = lazy(() => import("./pages/district/DistrictDashboard"));
const DistrictManagerDashboard = lazy(() => import("./pages/district/DistrictManagerDashboard"));
const RegisterDistrict = lazy(() => import("./pages/district/RegisterDistrict"));
const PolicyViewer = lazy(() => import("./pages/policies/PolicyViewer"));
const ReadingAnalyticsCalibration = lazy(() => import("./components/aura/ReadingAnalyticsCalibration"));
const ConsentVerification = lazy(() => import("./pages/ConsentVerification"));
const StoryManagement = lazy(() => import("./pages/teacher/StoryManagement"));
const SecurityPortal = lazy(() => import("./pages/SecurityPortal"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function RouteAwareProviders({ children }: { children: ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  // Only enable ML on routes that actually need it (prevents huge startup work)
  const enableML =
    /aura|reading|calibration/i.test(path) ||
    path.startsWith("/student/aura") ||
    path.startsWith("/teacher/aura");

  return <MLStatusProvider enabled={enableML}>{children}</MLStatusProvider>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PushNotificationPrompt />
          <SentryUserTracker />
          <BrowserRouter>
            <RouteAwareProviders>
              <OfflineIndicator />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/consent/:token" element={<ConsentVerification />} />
                  <Route path="/policies" element={<PolicyViewer />} />

                  {/* Protected routes */}
                  <Route element={<RequireAuth />}>
                    <Route path="/pending-verification" element={<PendingVerification />} />

                    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                    <Route path="/teacher/calendar" element={<TeacherCalendar />} />
                    <Route path="/teacher/questions/:classroomId" element={<QuestionsLibrary />} />
                    <Route path="/teacher/questions/:classroomId/:groupId" element={<QuestionGroupDetail />} />
                    <Route path="/teacher/assignment/create/:classroomId" element={<CreateMultiQuestionAssignment />} />
                    <Route path="/teacher/tournament/control" element={<TournamentControl />} />
                    <Route path="/teacher/aura-analytics/:classroomId?" element={<AuraAnalytics />} />
                    <Route path="/teacher/student/:studentId" element={<StudentProfile />} />
                    <Route path="/teacher/reading-calibration" element={<ReadingAnalyticsCalibration />} />
                    <Route path="/teacher/story-library" element={<StoryManagement />} />
                    <Route path="/teacher/review-submission/:submissionId" element={<ReviewSubmission />} />
                    <Route path="/teacher/assignment/review/:submissionId" element={<ReviewMultiQuestionSubmission />} />

                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/aura-practice" element={<AuraPractice />} />
                    <Route path="/student/assignment/:assignmentId" element={<CompleteAssignment />} />
                    <Route path="/student/review-submission/:submissionId" element={<ReviewMySubmission />} />
                    <Route path="/student/review-annotations/:submissionId" element={<ReviewMyAnnotations />} />

                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/classrooms/:id" element={<ClassroomDetail />} />
                    <Route path="/join-class" element={<JoinClass />} />

                    <Route path="/games" element={<Games />} />
                    <Route path="/games/jeopardy-1v1" element={<JeopardyGame />} />
                    <Route path="/games/number-maker" element={<NumberMaker />} />
                    <Route path="/games/name-that-animal" element={<NameThatAnimalGame />} />
                    <Route path="/games/us-states-quiz" element={<USStatesMapQuiz />} />

                    <Route path="/parent/dashboard" element={<ParentDashboard />} />
                    <Route path="/parent/calendar" element={<ParentCalendar />} />
                    <Route path="/parent/request-access" element={<RequestAccess />} />
                    <Route path="/parent/notification-settings" element={<NotificationSettings />} />
                    <Route path="/parent/child/:studentId" element={<ChildDetail />} />
                    <Route path="/parent/safety" element={<ParentSafety />} />
                    <Route path="/parent/review-submission/:submissionId" element={<ParentReviewSubmission />} />
                    <Route path="/parent/review-annotations/:submissionId" element={<ParentReviewAnnotations />} />
                    <Route path="/parent/install-app" element={<PWAInstallGuide />} />

                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/calendar" element={<AdminCalendar />} />
                    <Route path="/admin/settings" element={<SchoolSettings />} />
                    <Route path="/admin/safety" element={<AdminSafetyDashboard />} />
                    <Route path="/admin/safety/drill/:drillId" element={<AdminDrillMonitor />} />
                    <Route path="/admin/security" element={<AdminSecurityDashboard />} />

                    <Route path="/security" element={<SecurityPortal />} />
                    <Route path="/district/dashboard" element={<DistrictDashboard />} />
                    <Route path="/district-manager/dashboard" element={<DistrictManagerDashboard />} />
                    <Route path="/district/register" element={<RegisterDistrict />} />
                  </Route>

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </RouteAwareProviders>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
