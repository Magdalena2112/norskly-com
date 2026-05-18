import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Root entry. If the user is logged in and has a preferred learning language,
 * send them straight to that dashboard. Otherwise fall back to the landing page.
 */
const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("preferred_language, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!prof?.onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }
      const lang = prof?.preferred_language || localStorage.getItem("norskly_selected_language") || "norveski";
      navigate(`/ucenje/${lang}`, { replace: true });
    })();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return null; // redirect in effect
  return <Navigate to="/" replace />;
};

export default Index;
