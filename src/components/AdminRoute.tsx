import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();
  const { toast } = useToast();
  const toasted = useRef(false);

  useEffect(() => {
    if (!loading && !isAdmin && !toasted.current) {
      toasted.current = true;
      toast({
        title: "Pristup odbijen",
        description: "Nemate dozvolu za pristup ovoj stranici.",
        variant: "destructive",
      });
    }
  }, [loading, isAdmin, toast]);

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

  if (!isAdmin) {
    return <Navigate to="/practice" replace />;
  }

  return <>{children}</>;
}
