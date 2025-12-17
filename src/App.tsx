import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PendingVerification from "./pages/PendingVerification";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCalendar from "./pages/admin/AdminCalendar";
import SchoolSettings from "./pages/admin/SchoolSettings";
import AdminSafetyDashboard from "./pages/admin/AdminSafetyDashboard";
import AdminDrillMonitor from "./pages/admin/AdminDrillMonitor";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCalendar from "./pages/teacher/Calendar";
import StudentDashboard from "./pages/student/StudentDashboard";
import AuraPractice from "./pages/student/AuraPractice";
import Calendar from "./pages/student/Calendar";
import Games from "./pages/Games";
import JeopardyGame from "./pages/games/JeopardyGame";
import NumberMaker from "./pages/games/NumberMaker";
import JoinClass from "./pages/JoinClass";
import ClassroomDetail from "./pages/classrooms/ClassroomDetail";
import QuestionsLibrary from "./pages/teacher/QuestionsLibrary";
import QuestionGroupDetail from "./pages/teacher/QuestionGroupDetail";
import TournamentControl from "./pages/teacher/TournamentControl";
import AuraAnalytics from "./pages/teacher/AuraAnalytics";
import ReadingAssignment from "./pages/student/ReadingAssignment";
import CompleteAssignment from "./pages/student/CompleteAssignment";
import ReviewSubmission from "./pages/teacher/ReviewSubmission";
import ReviewMultiQuestionSubmission from "./pages/teacher/ReviewMultiQuestionSubmission";
import ReviewMySubmission from "./pages/student/ReviewMySubmission";
import ReviewMyAnnotations from "./pages/student/ReviewMyAnnotations";
import CreateMultiQuestionAssignment from "./pages/teacher/CreateMultiQuestionAssignment";
import StudentProfile from "./pages/teacher/StudentProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentCalendar from "./pages/parent/ParentCalendar";
import RequestAccess from "./pages/parent/RequestAccess";
import NotificationSettings from "./pages/parent/NotificationSettings";
import ChildDetail from "./pages/parent/ChildDetail";
import ParentSafety from "./pages/parent/ParentSafety";
import ParentReviewSubmission from "./pages/parent/ParentReviewSubmission";
import ParentReviewAnnotations from "./pages/parent/ParentReviewAnnotations";
import PWAInstallGuide from "./pages/parent/PWAInstallGuide";
import DistrictDashboard from "./pages/district/DistrictDashboard";
import DistrictManagerDashboard from "./pages/district/DistrictManagerDashboard";
import RegisterDistrict from "./pages/district/RegisterDistrict";
import PolicyViewer from "./pages/policies/PolicyViewer";
import NotFound from "./pages/NotFound";
import ReadingAnalyticsCalibration from "./components/aura/ReadingAnalyticsCalibration";
import ConsentVerification from "./pages/ConsentVerification";
import StoryManagement from "./pages/teacher/StoryManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PushNotificationPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending-verification" element={<PendingVerification />} />
          <Route path="/consent/:token" element={<ConsentVerification />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/calendar" element={<TeacherCalendar />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/aura-practice" element={<AuraPractice />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/classrooms/:id" element={<ClassroomDetail />} />
          <Route path="/teacher/questions/:classroomId" element={<QuestionsLibrary />} />
          <Route path="/teacher/questions/:classroomId/:groupId" element={<QuestionGroupDetail />} />
          <Route path="/teacher/assignment/create/:classroomId" element={<CreateMultiQuestionAssignment />} />
          <Route path="/teacher/tournament/control" element={<TournamentControl />} />
          <Route path="/teacher/aura-analytics/:classroomId?" element={<AuraAnalytics />} />
          <Route path="/teacher/student/:studentId" element={<StudentProfile />} />
          <Route path="/teacher/reading-calibration" element={<ReadingAnalyticsCalibration />} />
          <Route path="/teacher/story-library" element={<StoryManagement />} />
          <Route path="/student/assignment/:assignmentId" element={<CompleteAssignment />} />
          <Route path="/student/review-submission/:submissionId" element={<ReviewMySubmission />} />
          <Route path="/student/review-annotations/:submissionId" element={<ReviewMyAnnotations />} />
          <Route path="/teacher/review-submission/:submissionId" element={<ReviewSubmission />} />
          <Route path="/teacher/assignment/review/:submissionId" element={<ReviewMultiQuestionSubmission />} />
          <Route path="/join-class" element={<JoinClass />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/jeopardy-1v1" element={<JeopardyGame />} />
          <Route path="/games/number-maker" element={<NumberMaker />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
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
          <Route path="/district/dashboard" element={<DistrictDashboard />} />
          <Route path="/district-manager/dashboard" element={<DistrictManagerDashboard />} />
          <Route path="/district/register" element={<RegisterDistrict />} />
          <Route path="/policies" element={<PolicyViewer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
