import { useEffect, useState } from "react";
import norsklyLogo from "@/assets/norskly-logo.png.asset.json";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import JourneyStepper from "@/components/onboarding/JourneyStepper";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Persist language/plan choice from the journey
  useEffect(() => {
    const lang = searchParams.get("lang");
    const plan = searchParams.get("plan");
    if (lang) localStorage.setItem("norskly_selected_language", lang);
    if (plan) localStorage.setItem("norskly_selected_plan", plan);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Jezik koji je korisnik izabrao klikom u ovoj sesiji (URL ima prednost).
      const urlLang = searchParams.get("lang");
      const storedLang = localStorage.getItem("norskly_selected_language");
      const intentLang = urlLang || storedLang || null;
      const selectedPlan = localStorage.getItem("norskly_selected_plan");

      const slugToCode = (slug: string): "no" | "en" | "de" =>
        slug === "engleski" ? "en" : slug === "nemacki" ? "de" : "no";

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("preferred_language, subscription_type, display_name")
            .eq("user_id", data.user.id)
            .maybeSingle();

          // Sveža namera (URL/localStorage izbor) pobeđuje sačuvani preferred_language.
          const lang = intentLang || prof?.preferred_language || "norveski";
          const plan = prof?.subscription_type || selectedPlan;
          localStorage.setItem("norskly_selected_language", lang);
          if (plan) localStorage.setItem("norskly_selected_plan", plan);

          const code = slugToCode(lang);
          const { data: langProf } = await supabase
            .from("language_profiles")
            .select("onboarding_completed")
            .eq("user_id", data.user.id)
            .eq("language", code)
            .maybeSingle();

          const name = prof?.display_name?.trim();
          toast({
            title: name ? `Dobrodošao nazad, ${name} 👋` : "Dobrodošao nazad 👋",
            description: "Drago nam je što te ponovo vidimo.",
          });

          if (!langProf?.onboarding_completed) {
            navigate("/onboarding");
            return;
          }
          const qs = plan ? `?plan=${plan}` : "";
          navigate(`/ucenje/${lang}${qs}`);
          return;
        }
        navigate("/practice");

      } else {
        const signupLang = intentLang || "norveski";
        localStorage.setItem("norskly_selected_language", signupLang);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        // Sačuvaj izabrani jezik na profil novog korisnika
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ preferred_language: signupLang })
            .eq("user_id", data.user.id);
        }
        // Ako je sesija odmah dostupna (auto-confirm) — idi na onboarding za izabrani jezik.
        if (data.session) {
          toast({
            title: "Dobrodošao 👋",
            description: "Hajde da podesimo tvoj profil za ovaj jezik.",
          });
          navigate("/onboarding");
          return;
        }
        toast({
          title: "Registracija uspešna!",
          description: "Proverite email za potvrdu naloga.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Greška",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4">
        <BackButton to="/" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={norsklyLogo.url} alt="Norskly" className="h-12 w-auto mx-auto select-none" draggable={false} />
          <p className="text-muted-foreground text-sm mt-1">Adaptivno učenje jezika</p>
        </div>

        <div className="mb-6 flex justify-center">
          <JourneyStepper current={isLogin ? "learn" : "account"} />
        </div>

        <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{isLogin ? "Prijava" : "Registracija"}</CardTitle>
            <CardDescription>
              {isLogin ? "Uloguj se na svoj nalog" : "Kreiraj novi nalog"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tvoj@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button variant="hero" className="w-full" disabled={loading}>
                {loading ? "Učitavanje..." : isLogin ? "Prijavi se" : "Registruj se"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Nemaš nalog?" : "Već imaš nalog?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-accent font-medium hover:underline"
              >
                {isLogin ? "Registruj se" : "Prijavi se"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <button onClick={() => navigate("/")} className="hover:underline">
            ← Nazad na početnu
          </button>
        </p>
      </motion.div>
    </div>
  );
}
