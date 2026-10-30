import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { getActiveLanguageCode, isLanguageOnboarded } from "@/lib/onboardingStatus";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { codeToSlug } from "@/lib/onboardingStatus";
import { hasStoredCourse } from "@/lib/courseSelection";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const activeLang = getActiveLanguageCode(location.pathname);
  const activeCourse = useSelectedCourse(activeLang);
  const explicitCourse = new URLSearchParams(location.search).has("course");
  const needsCourseChoice = !explicitCourse && !hasStoredCourse(activeLang) && location.pathname !== "/onboarding";
  const skipOnboarding = isAdmin || isTeacher;
  const lessonRef = new URLSearchParams(location.search).get("lesson") || location.pathname.match(/^\/lekcija\/([^/]+)/)?.[1];
  const { data: lessonAllowed, isLoading: lessonLoading } = useQuery({
    queryKey: ["lesson-access", user?.id, lessonRef, activeLang, activeCourse],
    enabled: !!user && !skipOnboarding && !needsCourseChoice && !!lessonRef,
    queryFn: async () => {
      const field = /^[0-9a-f-]{36}$/i.test(lessonRef || "") ? "id" : "lesson_code";
      const { data, error } = await supabase.from("course_lessons").select("id,language,course").eq(field, lessonRef || "").maybeSingle();
      return !error && !!data && data.language === activeLang && data.course === activeCourse;
    },
    staleTime: 0,
  });

  const { data: onboardingCompleted, isLoading: onboardingLoading, isError: onboardingError, refetch } = useQuery({
    queryKey: ["onboarding-status", user?.id, activeLang, activeCourse],
    queryFn: async () => (user ? isLanguageOnboarded(user.id, activeLang, activeCourse) : false),
    enabled: !!user && !skipOnboarding && !needsCourseChoice,
    staleTime: Infinity,
  });

  if (loading || roleLoading || (!!user && !skipOnboarding && (onboardingLoading || (!!lessonRef && lessonLoading)))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    if (location.pathname.startsWith("/teacher")) return <Navigate to="/profesori/prijava" replace />;
    const m = location.pathname.match(/^\/ucenje\/([^/]+)/);
    return <Navigate to={m ? `/auth?lang=${m[1]}${explicitCourse ? `&course=${activeCourse}` : ""}` : "/auth"} replace />;
  }

  if (isAdmin) return <>{children}</>;

  // Teachers live in their own workspace — never the student onboarding/modules
  if (isTeacher) {
    if (!location.pathname.startsWith("/teacher")) return <Navigate to="/teacher/dashboard" replace />;
    return <>{children}</>;
  }

  // Reuse the enrollment-aware chooser before an implicit default can create
  // onboarding intent. It opens a sole enrollment or offers all existing ones.
  if (location.pathname !== "/onboarding" && !explicitCourse && (needsCourseChoice || (!onboardingError && !onboardingCompleted))) {
    return <Navigate to={`/auth?choose=courses&lang=${codeToSlug(activeLang)}`} replace />;
  }

  if (onboardingError) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p>Kurs nije učitan. Pokušaj ponovo.</p>
      <Button onClick={() => void refetch()}>Pokušaj ponovo</Button>
    </div>;
  }

  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to={`/onboarding?lang=${codeToSlug(activeLang)}&course=${activeCourse}`} replace />;
  }
  if (lessonRef && !lessonAllowed) return <Navigate to={`/ucenje/${codeToSlug(activeLang)}?course=${activeCourse}`} state={{ courseDenied: true }} replace />;

  return <>{children}</>;
}
