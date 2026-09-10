import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProfileProvider } from "@/context/ProfileContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { TeacherRoute } from "@/components/TeacherRoute";
import LanguageSync from "@/components/LanguageSync";
// Public homepage stays eager so first paint / LCP is unaffected.
import LandingPage from "./pages/LandingPage";

const ForTeachersPage = lazy(() => import("./pages/ForTeachersPage"));
const LanguagePage = lazy(() => import("./pages/LanguagePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GrammarPage = lazy(() => import("./pages/GrammarPage"));
const VocabularyPage = lazy(() => import("./pages/VocabularyPage"));
const WritingPage = lazy(() => import("./pages/WritingPage"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const TalkPage = lazy(() => import("./pages/TalkPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const TeacherProfilePage = lazy(() => import("./pages/TeacherProfilePage"));
const SelectTeacherPage = lazy(() => import("./pages/SelectTeacherPage"));
const BookingSuccessPage = lazy(() => import("./pages/BookingSuccessPage"));
const TeacherDashboardPage = lazy(() => import("./pages/TeacherDashboardPage"));
const TeacherStudentsPage = lazy(() => import("./pages/TeacherStudentsPage"));
const TeacherStudentDetailPage = lazy(() => import("./pages/TeacherStudentDetailPage"));
const MyLessonsPage = lazy(() => import("./pages/MyLessonsPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminStudentsPage = lazy(() => import("./pages/AdminStudentsPage"));
const AdminStudentDetailPage = lazy(() => import("./pages/AdminStudentDetailPage"));
const AdminLessonsPage = lazy(() => import("./pages/AdminLessonsPage"));
const AdminAvailabilityPage = lazy(() => import("./pages/AdminAvailabilityPage"));
const AdminTeacherProfilePage = lazy(() => import("./pages/AdminTeacherProfilePage"));
const AdminTeacherApplicationsPage = lazy(() => import("./pages/AdminTeacherApplicationsPage"));
const AdminTeacherApplicationDetailPage = lazy(() => import("./pages/AdminTeacherApplicationDetailPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HomeRedirect = lazy(() => import("@/components/HomeRedirect"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" />
      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProfileProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LanguageSync />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<HomeRedirect />} />
                <Route path="/za-profesore" element={<ForTeachersPage />} />
                <Route path="/jezici/:slug" element={<LanguagePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                <Route path="/practice" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/ucenje/:slug" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/grammar" element={<ProtectedRoute><GrammarPage /></ProtectedRoute>} />
                <Route path="/vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
                <Route path="/writing" element={<ProtectedRoute><WritingPage /></ProtectedRoute>} />
                <Route path="/reading" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
                <Route path="/talk" element={<ProtectedRoute><TalkPage /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/select-teacher" element={<ProtectedRoute><SelectTeacherPage /></ProtectedRoute>} />
                <Route path="/book-lesson" element={<ProtectedRoute><SelectTeacherPage /></ProtectedRoute>} />
                <Route path="/book-lesson/:teacherId" element={<ProtectedRoute><TeacherProfilePage /></ProtectedRoute>} />
                <Route path="/booking/success/:lessonId" element={<ProtectedRoute><BookingSuccessPage /></ProtectedRoute>} />
                <Route path="/teacher/dashboard" element={<ProtectedRoute><TeacherRoute><TeacherDashboardPage /></TeacherRoute></ProtectedRoute>} />
                <Route path="/teacher/students" element={<ProtectedRoute><TeacherRoute><TeacherStudentsPage /></TeacherRoute></ProtectedRoute>} />
                <Route path="/teacher/students/:studentId" element={<ProtectedRoute><TeacherRoute><TeacherStudentDetailPage /></TeacherRoute></ProtectedRoute>} />
                <Route path="/my-lessons" element={<ProtectedRoute><MyLessonsPage /></ProtectedRoute>} />
                {/* Admin routes */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminRoute><AdminDashboardPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/students" element={<ProtectedRoute><AdminRoute><AdminStudentsPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/students/:userId" element={<ProtectedRoute><AdminRoute><AdminStudentDetailPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/lessons" element={<ProtectedRoute><AdminRoute><AdminLessonsPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/availability" element={<ProtectedRoute><AdminRoute><AdminAvailabilityPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/teacher-profile" element={<ProtectedRoute><AdminRoute><AdminTeacherProfilePage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/teacher-applications" element={<ProtectedRoute><AdminRoute><AdminTeacherApplicationsPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/admin/teacher-applications/:id" element={<ProtectedRoute><AdminRoute><AdminTeacherApplicationDetailPage /></AdminRoute></ProtectedRoute>} />
                <Route path="/unsubscribe" element={<UnsubscribePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
