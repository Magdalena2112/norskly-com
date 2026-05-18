import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function TeacherRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsTeacher(false);
      return;
    }
    let cancel = false;
    supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancel) setIsTeacher(!!data);
      });
    return () => {
      cancel = true;
    };
  }, [user]);

  if (isTeacher === null) {
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

  if (!isTeacher) return <Navigate to="/practice" replace />;
  return <>{children}</>;
}
