import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudyMaterials from "./pages/student/StudyMaterials";
import AuraPractice from "./pages/student/AuraPractice";
import Games from "./pages/Games";
import JeopardyGame from "./pages/games/JeopardyGame";
import JoinClass from "./pages/JoinClass";
import ClassroomDetail from "./pages/classrooms/ClassroomDetail";
import QuestionsLibrary from "./pages/teacher/QuestionsLibrary";
import QuestionGroupDetail from "./pages/teacher/QuestionGroupDetail";
import TournamentControl from "./pages/teacher/TournamentControl";
import AuraAnalytics from "./pages/teacher/AuraAnalytics";
import ReadingAssignment from "./pages/student/ReadingAssignment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/study" element={<StudyMaterials />} />
          <Route path="/student/aura-practice" element={<AuraPractice />} />
          <Route path="/classrooms/:id" element={<ClassroomDetail />} />
          <Route path="/teacher/questions/:classroomId" element={<QuestionsLibrary />} />
          <Route path="/teacher/questions/:classroomId/:groupId" element={<QuestionGroupDetail />} />
          <Route path="/teacher/tournament/control" element={<TournamentControl />} />
          <Route path="/teacher/aura-analytics/:classroomId?" element={<AuraAnalytics />} />
          <Route path="/student/assignment/:assignmentId" element={<ReadingAssignment />} />
          <Route path="/join-class" element={<JoinClass />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/jeopardy-1v1" element={<JeopardyGame />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
