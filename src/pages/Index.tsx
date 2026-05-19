import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isLanguageOnboarded } from "@/lib/onboardingStatus";

const SLUG_TO_CODE: Record<string, "no" | "en" | "de"> = {
  norveski: "no",
  engleski: "en",
  nemacki: "de",
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();

      // Sveža namera (klik na jezik) pobeđuje istorijski preferred_language.
      const storedSlug = localStorage.getItem("norskly_selected_language");
      const slug = storedSlug || prof?.preferred_language || "norveski";
      localStorage.setItem("norskly_selected_language", slug);
      const code = SLUG_TO_CODE[slug] || "no";

      const done = await isLanguageOnboarded(user.id, code);
      if (!done) {
        navigate("/onboarding", { replace: true });
        return;
      }
      navigate(`/ucenje/${slug}`, { replace: true });
    })();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (user) return null;
  return <Navigate to="/" replace />;
};

export default Index;
