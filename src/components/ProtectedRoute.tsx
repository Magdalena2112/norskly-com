import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { getActiveLanguageCode, isLanguageOnboarded } from "@/lib/onboardingStatus";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isTeacher, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const activeLang = getActiveLanguageCode(location.pathname);
  const skipOnboarding = isAdmin || isTeacher;

  const { data: onboardingCompleted, isLoading: onboardingLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id, activeLang],
    queryFn: async () => (user ? isLanguageOnboarded(user.id, activeLang) : false),
    enabled: !!user && !skipOnboarding,
    staleTime: Infinity,
  });

  if (loading || roleLoading || (!!user && !skipOnboarding && onboardingLoading)) {
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
    return <Navigate to={m ? `/auth?lang=${m[1]}` : "/auth"} replace />;
  }

  if (isAdmin) return <>{children}</>;

  // Teachers live in their own workspace — never the student onboarding/modules
  if (isTeacher) {
    if (!location.pathname.startsWith("/teacher")) return <Navigate to="/teacher/dashboard" replace />;
    return <>{children}</>;
  }

  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
