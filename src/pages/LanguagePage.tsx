import { useEffect } from "react";
import norsklyLogo from "@/assets/norskly-logo.png.asset.json";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Check, Sparkles, Star, GraduationCap, Clock } from "lucide-react";
import { getLanguageBySlug } from "@/lib/languages";
import JourneyStepper from "@/components/onboarding/JourneyStepper";
import teacherPhotoFallback from "@/assets/teacher-photo.jpg";

const PLANS = [
  {
    id: "trial",
    name: "7 dana besplatno",
    price: "0€",
    per: "prvih 7 dana",
    highlight: true,
    features: [
      "Pun pristup AI modulima",
      "Gramatika, vokabular i razgovori",
      "Bez obaveze i bez kartice",
    ],
    cta: "Probaj besplatno",
  },
  {
    id: "self",
    name: "Self-Learning",
    price: "22€",
    per: "/mesec",
    features: [
      "Kompletan AI sadržaj",
      "AI razgovori i feedback",
      "Praćenje napretka",
      "Neograničeno učenje",
    ],
    cta: "Izaberi plan",
  },
  {
    id: "lessons",
    name: "Learning + Lessons",
    price: "19€",
    per: "/mesec + časovi",
    features: [
      "Sve iz Self-Learning plana",
      "Rezervacija živih časova",
      "Podrška profesora",
      "Časovi se naplaćuju zasebno",
    ],
    cta: "Izaberi plan",
  },
];

export default function LanguagePage() {
  const { slug } = useParams<{ slug: string }>();
  const lang = getLanguageBySlug(slug);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (lang) {
      document.title = `${lang.label} · Norskly`;
      localStorage.setItem("norskly_selected_language", lang.slug);
      window.dispatchEvent(new Event("language-changed"));
    }
  }, [lang]);

  if (!lang) return <Navigate to="/" replace />;

  const { data: teacher } = useQuery({
    queryKey: ["lang-teacher", lang.slug],
    enabled: lang.available,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_teacher_profile_public");
      if (error) throw error;
      return (data && data[0]) || null;
    },
  });

  const goAuth = async (extra: Record<string, string> = {}) => {
    if (extra.plan) localStorage.setItem("norskly_selected_plan", extra.plan);
    // Ulogovan korisnik: proveri da li već ima onboarding za ovaj jezik.
    if (user && lang) {
      if (extra.next) {
        navigate(extra.next);
        return;
      }
      const { data: langProf } = await supabase
        .from("language_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .eq("language", lang.code)
        .maybeSingle();
      if (langProf?.onboarding_completed) {
        navigate(`/ucenje/${lang.slug}`);
      } else {
        navigate("/onboarding");
      }
      return;
    }
    const params = new URLSearchParams({ lang: lang.slug, ...extra });
    navigate(`/auth?${params.toString()}`);
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const teacherCards = lang.available && teacher
    ? [{
        name: teacher.name || "Ingrid Haugen",
        bio: teacher.bio || "Iskusan profesor norveškog jezika.",
        focus: (teacher.focus as string[]) || ["Konverzacija", "Gramatika"],
        rating: teacher.rating || 5.0,
        students: teacher.students_count || 0,
        duration: teacher.duration_minutes || 90,
        photo: teacher.photo_url || teacherPhotoFallback,
      }]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={norsklyLogo.url} alt="Norskly" className="h-12 w-auto select-none" draggable={false} />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Prijava</Button>
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90" onClick={() => goAuth({ plan: "trial" })}>
              Započni besplatno
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="absolute top-24 -right-20 w-96 h-96 rounded-full bg-secondary/60 blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-accent/40 blur-3xl opacity-60 pointer-events-none" />

        <div className="container relative">
          <div className="max-w-3xl">
            <JourneyStepper current="explore" className="mb-8" selectedLanguage={lang.slug} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/70 text-primary text-xs font-semibold tracking-widest uppercase mb-6">
                <span>{lang.flag}</span> {lang.label}
                {!lang.available && (
                  <Badge variant="outline" className="ml-1 border-accent/60 text-accent">Uskoro</Badge>
                )}
              </span>

              <h1 className="text-display text-[clamp(2.4rem,7vw,5.5rem)] text-primary mb-6 leading-[1.05]">
                {lang.heroTitle}
              </h1>

              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                {lang.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="rounded-full h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-soft"
                  onClick={() => goAuth({ plan: "trial" })}
                  disabled={!lang.available}
                >
                  Započni besplatno <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-14 px-8 text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => scrollTo("plans")}
                >
                  Pogledaj planove
                </Button>
              </div>

              {!lang.available && (
                <p className="mt-6 text-sm text-muted-foreground">
                  Trenutno gradimo {lang.label.toLowerCase()} program. Ostavi nalog i obavestićemo te čim krenemo.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      <section id="teachers" className="py-20 md:py-24 bg-card/60">
        <div className="container">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Profesori</p>
            <h2 className="text-display text-[clamp(2rem,4.5vw,3.5rem)] text-primary">
              Uči sa <span className="font-script text-primary/70">stručnjacima</span>.
            </h2>
            <p className="text-muted-foreground mt-3">
              Naši profesori su pažljivo izabrani — sa iskustvom u podučavanju i toplim pristupom.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lang.available && teacherCards.length > 0 ? (
              teacherCards.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Card className="h-full rounded-3xl border-border hover:shadow-soft hover:-translate-y-1 transition-all">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 border-2 border-background shadow">
                          <AvatarImage src={t.photo} alt={t.name} />
                          <AvatarFallback>{t.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-xl font-bold text-primary">{t.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                            {t.rating.toFixed(1)} · {t.students > 0 ? `${t.students}+ studenata` : "Novo"}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{t.bio}</p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {t.focus.slice(0, 3).map((f) => (
                          <Badge key={f} variant="secondary" className="font-normal">{f}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.duration} min</span>
                        <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> 1 na 1</span>
                      </div>

                      <Button
                        className="mt-6 rounded-full bg-primary hover:bg-primary/90"
                        onClick={() => goAuth({ next: "/book-lesson" })}
                      >
                        Rezerviši čas <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              [0, 1, 2].map((i) => (
                <Card key={i} className="rounded-3xl border-dashed border-border bg-background/50">
                  <CardContent className="p-6 text-center min-h-[280px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-secondary/70 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-primary/60" />
                    </div>
                    <p className="font-display text-lg text-primary mb-1">Uskoro</p>
                    <p className="text-sm text-muted-foreground">Profesori {lang.label.toLowerCase()} stižu uskoro.</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="plans" className="py-20 md:py-24">
        <div className="container">
          <div className="max-w-2xl mb-12 text-center mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Planovi</p>
            <h2 className="text-display text-[clamp(2rem,4.5vw,3.5rem)] text-primary">
              Počni <span className="font-script text-primary/70">besplatno</span>.
            </h2>
            <p className="text-muted-foreground mt-3">
              Probaj 7 dana besplatno. Bez kartice, bez obaveza.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card
                  className={`h-full rounded-3xl transition-all ${
                    p.highlight
                      ? "border-2 border-accent shadow-accent-glow bg-card"
                      : "border-border hover:shadow-soft"
                  }`}
                >
                  <CardContent className="p-7 flex flex-col h-full">
                    {p.highlight && (
                      <Badge className="self-start mb-3 bg-accent text-accent-foreground hover:bg-accent">
                        Najpopularnije
                      </Badge>
                    )}
                    <h3 className="font-display text-2xl font-bold text-primary">{p.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-display font-black text-foreground">{p.price}</span>
                      <span className="text-sm text-muted-foreground">{p.per}</span>
                    </div>

                    <ul className="space-y-2.5 mt-6 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-foreground/85">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`mt-7 rounded-full ${
                        p.highlight
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                      onClick={() => goAuth({ plan: p.id })}
                      disabled={!lang.available && p.id !== "trial"}
                    >
                      {p.cta} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTRATION CTA */}
      <section className="py-20 md:py-24 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center">
          <h2 className="text-display text-[clamp(2rem,5vw,4rem)] mb-5">
            Spreman/na <span className="font-script opacity-80">da</span> kreneš?
          </h2>
          <p className="text-primary-foreground/80 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Kreiraj nalog i započni svoj 7-dnevni besplatni period. Bez kartice.
          </p>
          <Button
            size="lg"
            className="rounded-full h-14 px-10 text-base bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => goAuth({ plan: "trial" })}
          >
            Kreiraj nalog i počni <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
