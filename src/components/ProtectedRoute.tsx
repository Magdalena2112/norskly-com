import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
