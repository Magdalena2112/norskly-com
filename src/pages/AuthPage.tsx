import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import norsklyLogo from "@/assets/norskly-logo-new.webp.asset.json";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import JourneyStepper from "@/components/onboarding/JourneyStepper";
import { useAuth } from "@/context/AuthContext";
import { courseKey, courseLabel, coursePath, courseSlug, loginChoices, selectCourse, type EnrollmentChoice } from "@/lib/courseSelection";
import { courseIntent, courseStartLevel, promoAvailableLevels } from "@/lib/courseAccess";

export default function AuthPage() {
  // „Registruj se" u zaglavlju otvara odmah karticu Registracije (?mode=signup).
  const [isLogin, setIsLogin] = useState(() => {
    if (typeof window === "undefined") return true;
    return new URLSearchParams(window.location.search).get("mode") !== "signup";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const VALID = ["norveski", "engleski", "nemacki"];
  const urlLangParam = searchParams.get("lang");
  const lockedLang = urlLangParam && VALID.includes(urlLangParam) ? urlLangParam : null;
  const [pickedLang, setPickedLang] = useState<string | null>(lockedLang);
  useEffect(() => { if (lockedLang) setPickedLang(lockedLang); }, [lockedLang]);
  const { user: currentUser } = useAuth();
  const [chooseFrom, setChooseFrom] = useState<EnrollmentChoice[] | null>(null);

  const openCourse = (enrollment: EnrollmentChoice) => {
    selectCourse(enrollment.language, enrollment.course_type);
    navigate(coursePath(enrollment));
  };

  const routeStudent = async (userId: string, lang?: string | null) => {
    const code = lang ? (lang === "engleski" ? "en" : lang === "nemacki" ? "de" : "no") : null;
    const explicitCourse = searchParams.has("course") && code ? courseIntent(searchParams.get("course"), code) : null;
    const { data: rows, error } = await supabase.from("course_enrollments")
      .select("language,course_type,level,onboarding_completed").eq("user_id", userId);
    if (error) throw error;
    const choices = loginChoices(rows ?? [], code, explicitCourse);
    if (choices.length === 1) { openCourse(choices[0]); return; }
    if (choices.length > 1) { setChooseFrom(choices); return; }
    if (lang && code) {
      const course = explicitCourse ?? "general";
      const level = courseStartLevel(searchParams.get("level"), course, promoAvailableLevels(code, course));
      selectCourse(code, course);
      navigate(`/onboarding?lang=${lang}&course=${course}&level=${level}`);
    } else { navigate("/#courses"); }
  };

  useEffect(() => {
    if (!currentUser || (!isLogin && searchParams.get("choose") !== "courses")) return;
    (async () => {
      const {data: roles, error} = await supabase.from("user_roles").select("role").eq("user_id", currentUser.id);
      if (error) throw error;
      if (roles?.some(r => r.role === "admin" || r.role === "admin_teacher")) { navigate("/admin/dashboard", {replace:true}); return; }
      if (roles?.some(r => r.role === "teacher")) { navigate("/teacher/dashboard", {replace:true}); return; }
      await routeStudent(currentUser.id, lockedLang);
    })().catch(() => toast({ title: "Kursevi nisu učitani", variant: "destructive" }));
  }, [currentUser?.id, searchParams.toString(), isLogin]);

  // Persist plan choice from the journey
  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan) localStorage.setItem("norskly_selected_plan", plan);
  }, [searchParams]);

  const handleForgot = async () => {
    if (!email.trim()) {
      toast({ title: "Unesi email", description: "Upiši email adresu pa ponovo klikni „Zaboravljena lozinka?”." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    toast(
      error
        ? { title: "Greška", description: error.message, variant: "destructive" }
        : { title: "Proveri email", description: "Poslali smo ti link za postavljanje nove lozinke." },
    );
  };

  const handleGoogle = async () => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", "login");
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?${params.toString()}`,
    });
    if (result.error) {
      setLoading(false);
      toast({ title: "Prijava nije uspela", description: "Pokušaj ponovo ili koristi email.", variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    setLoading(false);
    setIsLogin(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedLang && !isLogin) {
      toast({ title: "Izaberi jezik", description: "Izaberi jezik na koji se prijavljuješ.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      // Jezik je uvek eksplicitan: sa jezičke stranice (URL) ili izabran ovde.
      const intentLang = pickedLang as string;
      const selectedPlan = localStorage.getItem("norskly_selected_plan");

      const slugToCode = (slug: string): "no" | "en" | "de" =>
        slug === "engleski" ? "en" : slug === "nemacki" ? "de" : "no";

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          // Uloga ima prednost nad jezikom: admin → admin panel, profesor → profesorski panel.
          const { data: roleRows } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);
          const roles = (roleRows ?? []).map((r) => r.role as string);
          if (roles.includes("admin") || roles.includes("admin_teacher")) {
            toast({ title: "Dobrodošla nazad 👋", description: "Otvaram admin panel." });
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          if (roles.includes("teacher")) {
            navigate("/teacher/dashboard", { replace: true });
            return;
          }
          const { data: prof } = await supabase
            .from("profiles")
            .select("preferred_language, subscription_type, display_name")
            .eq("user_id", data.user.id)
            .maybeSingle();
          const plan = prof?.subscription_type || selectedPlan;
          if (plan) localStorage.setItem("norskly_selected_plan", plan);
          const name = prof?.display_name?.trim();
          toast({
            title: name ? `Dobrodošao nazad, ${name} 👋` : "Dobrodošao nazad 👋",
            description: "Drago nam je što te ponovo vidimo.",
          });

          await routeStudent(data.user.id, intentLang);
          return;
        }
        navigate("/practice");

      } else {
        const signupLang = intentLang;
        const signupCode = slugToCode(signupLang);
        const signupCourse = courseIntent(searchParams.get("course"), signupCode);
        const signupLevel = courseStartLevel(searchParams.get("level"), signupCourse, promoAvailableLevels(signupCode, signupCourse));
        localStorage.setItem("norskly_selected_language", signupLang);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?choose=courses&lang=${signupLang}&course=${signupCourse}&level=${signupLevel}`,
            data: { signup_language: signupLang, signup_course: signupCourse, signup_level: signupLevel },
          },
        });
        if (error) throw error;
        // Postojeći email: sistem vraća korisnika bez identiteta i ne šalje novi mejl.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setIsLogin(true);
          toast({
            title: "Nalog već postoji",
            description: "Nalog sa ovim emailom već postoji. Prijavi se ili iskoristi „Zaboravljena lozinka?”.",
          });
          return;
        }
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
          navigate(`/onboarding?lang=${signupLang}&course=${signupCourse}&level=${signupLevel}`);
          return;
        }
        toast({
          title: "Registracija uspešna!",
          description: "Proverite email za potvrdu naloga.",
        });
      }
    } catch (err: any) {
      const msg = String(err?.message || "");
      toast({
        title: "Greška",
        description: /invalid login credentials/i.test(msg)
          ? "Pogrešan email ili lozinka. Ako si zaboravila lozinku, klikni „Zaboravljena lozinka?”."
          : /email not confirmed/i.test(msg)
          ? "Email još nije potvrđen. Proveri inbox i spam folder."
          : msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Helmet>
        <title>Prijava i registracija | Norskly</title>
        <meta
          name="description"
          content="Prijavi se na svoj Norskly nalog ili kreiraj novi i nastavi učenje jezika tamo gde si stao."
        />
        <link rel="canonical" href="https://norskly.com/auth" />
        <meta property="og:title" content="Prijava i registracija | Norskly" />
        <meta property="og:description" content="Prijavi se na Norskly ili napravi nalog i nastavi učenje svojim tempom." />
        <meta property="og:url" content="https://norskly.com/auth" />
        <meta name="twitter:title" content="Prijava i registracija | Norskly" />
        <meta name="twitter:description" content="Prijavi se na Norskly ili napravi nalog i nastavi učenje svojim tempom." />
      </Helmet>
      <div className="absolute top-4 left-4">
        <BackButton to="/" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={norsklyLogo.url} alt="Norskly" width={800} height={739} fetchPriority="high" decoding="async" className="h-14 w-auto mx-auto select-none" draggable={false} />
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
            {chooseFrom ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">Koji kurs želiš sada da otvoriš?</p>
                {chooseFrom.map((enrollment) => (
                  <Button key={courseKey(enrollment)} variant="outline" className="w-full h-auto min-h-11 whitespace-normal" onClick={() => openCourse(enrollment)}>
                    {courseLabel(enrollment)}
                  </Button>
                ))}
              </div>
            ) : (
            <>
            <Button type="button" variant="outline" className="w-full gap-2 mb-4" disabled={loading} onClick={handleGoogle}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>
              Nastavi putem Google-a
            </Button>
            <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />ili putem emaila<div className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                {(lockedLang || !isLogin) && <Label>{lockedLang ? "Jezik" : "Izaberi jezik"}</Label>}
                {lockedLang ? (
                  <p className="text-sm font-medium text-primary">
                    {lockedLang === "engleski" ? "🇬🇧 Engleski" : lockedLang === "nemacki" ? "🇩🇪 Nemački" : "🇳🇴 Norveški"}
                  </p>
                ) : isLogin ? null : (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["norveski", "🇳🇴 Norveški"],
                      ["engleski", "🇬🇧 Engleski"],
                      ["nemacki", "🇩🇪 Nemački"],
                    ].map(([slug, label]) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setPickedLang(slug)}
                        aria-pressed={pickedLang === slug}
                        className={`rounded-full border px-2 py-2 text-xs sm:text-sm transition-colors ${
                          pickedLang === slug
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background/60 text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgot}
                      className="text-xs text-accent font-medium hover:underline"
                    >
                      Zaboravljena lozinka?
                    </button>
                  </div>
                )}
              </div>
              <Button variant="hero" className="w-full" disabled={loading}>
                {loading ? "Učitavanje..." : isLogin ? "Prijavi se" : "Registruj se"}
              </Button>
            </form>
            )}

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
          Predaješ na Norskly-ju?{" "}
          <button onClick={() => navigate("/profesori/prijava")} className="text-accent font-medium hover:underline">
            Prijavi se kao profesor
          </button>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
          <button onClick={() => navigate("/")} className="hover:underline">
            ← Nazad na početnu
          </button>
        </p>
      </motion.div>
    </div>
  );
}
