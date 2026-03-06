import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import GrammarPage from "./pages/GrammarPage";
import VocabularyPage from "./pages/VocabularyPage";
import TalkPage from "./pages/TalkPage";
import ProgressPage from "./pages/ProgressPage";
import BookLessonPage from "./pages/BookLessonPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import MyLessonsPage from "./pages/MyLessonsPage";
import AdminAvailabilityPage from "./pages/AdminAvailabilityPage";
import AdminLessonsPage from "./pages/AdminLessonsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProfileProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
              <Route path="/practice" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/grammar" element={<ProtectedRoute><GrammarPage /></ProtectedRoute>} />
              <Route path="/vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
              <Route path="/talk" element={<ProtectedRoute><TalkPage /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
              <Route path="/book-lesson" element={<ProtectedRoute><TeacherProfilePage /></ProtectedRoute>} />
              <Route path="/my-lessons" element={<ProtectedRoute><MyLessonsPage /></ProtectedRoute>} />
              <Route path="/admin/availability" element={<ProtectedRoute><AdminAvailabilityPage /></ProtectedRoute>} />
              <Route path="/admin/lessons" element={<ProtectedRoute><AdminLessonsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
