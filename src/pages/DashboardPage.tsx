import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Languages, MessageSquare, GraduationCap, CalendarCheck, PenLine, BookOpenText } from "lucide-react";
import XpProgressCard from "@/components/XpProgressCard";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import WeeklyDigest from "@/components/WeeklyDigest";
import { format } from "date-fns";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import FjordHero from "@/components/student/FjordHero";
import PostcardVignette from "@/components/student/PostcardVignette";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";
import { getLanguageBySlug, getLanguageByCode, type LanguageSlug } from "@/lib/languages";

type ModuleDef = {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof BookOpen;
  route: string;
  vignette: "book" | "stamp" | "speech" | "cabins";
  iconBg: string;
  rotation: string;
  buttonLabel?: string;
  fullWidth?: boolean;
  stamp?: boolean;
};


export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { slug: storedSlug, code, setLanguage } = useSelectedLanguage();

  // If the URL carries /ucenje/:slug, make it the active language.
  useEffect(() => {
    if (!routeSlug) return;
    const fromUrl = getLanguageBySlug(routeSlug);
    if (fromUrl && fromUrl.slug !== storedSlug) {
      setLanguage(fromUrl.slug as LanguageSlug);
    }
  }, [routeSlug, storedSlug, setLanguage]);

  const activeLang = useMemo(
    () => (routeSlug ? getLanguageBySlug(routeSlug) : undefined) || getLanguageByCode(code),
    [routeSlug, code],
  );
  const ui = activeLang.ui;

  const modules: ModuleDef[] = useMemo(
    () => [
      { title: "Gramatika", subtitle: ui.module.grammar, description: "Vežbaj gramatiku kroz kvizove i objašnjenja prilagođena tvom nivou.", icon: BookOpen, route: "/grammar", vignette: "book", iconBg: "bg-primary", rotation: "rotate-card-1" },
      { title: "Vokabular", subtitle: ui.module.vocabulary, description: "Uči nove reči sa flashcard sistemom.", icon: Languages, route: "/vocabulary", vignette: "stamp", iconBg: "bg-sunset", rotation: "rotate-card-2" },
      { title: "Razgovor", subtitle: ui.module.talk, description: "Vežbaj pisanje poruka u realnim situacijama.", icon: MessageSquare, route: "/talk", vignette: "speech", iconBg: "bg-fjord", rotation: "rotate-card-3" },
      { title: "Pisanje", subtitle: ui.module.writing, description: "Vežbaj pisanje, bildebeskrivelse i dobij detaljan feedback.", icon: PenLine, route: "/writing", vignette: "book", iconBg: "bg-accent", rotation: "rotate-card-4" },
      { title: "Čitanje", subtitle: ui.module.reading, description: "Čitaj tekstove prilagođene tvom nivou i reši vežbe razumevanja.", icon: BookOpenText, route: "/reading", vignette: "stamp", iconBg: "bg-fjord", rotation: "rotate-card-2" },
      { title: "Razgovor sa profesorom", subtitle: ui.module.teacher, description: `Rezerviši 90-minutni čas sa profesorom ${activeLang.label.toLowerCase()}.`, icon: GraduationCap, route: "/book-lesson", vignette: "cabins", iconBg: "bg-forest", rotation: "rotate-card-1", buttonLabel: "Rezerviši čas", fullWidth: true },
    ],
    [ui, activeLang.label],
  );

  const [xpData, setXpData] = useState<{ total_xp: number; level: number } | null>(null);
  const [upcomingLesson, setUpcomingLesson] = useState<{ start_time: string; end_time: string; status: string } | null>(null);
  const [lessonLoaded, setLessonLoaded] = useState(false);


  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: xp }, { data: lesson }] = await Promise.all([
        supabase.from("user_xp").select("total_xp, level").eq("user_id", user.id).eq("language", code).maybeSingle(),
        supabase.from("lessons").select("start_time, end_time, status").eq("user_id", user.id).eq("language", code).eq("status", "scheduled").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(1).maybeSingle(),
      ]);
      setXpData(xp || { total_xp: 0, level: 1 });
      setUpcomingLesson(lesson);
      setLessonLoaded(true);
    })();
  }, [user, code]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-8 sm:py-10 relative z-10">
        {/* HERO POSTCARD */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8 washi-tape"
        >
          <div className="rounded-3xl border border-border/50 bg-cream/90 backdrop-blur-md shadow-postcard overflow-hidden grid md:grid-cols-5">
            <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-center">
              <p className="font-script italic text-primary/60 text-sm mb-1">{ui.heroScript}</p>
              <h1 className="text-display text-3xl sm:text-4xl text-primary mb-3 leading-[0.95]">
                Hei, {profile.name || "korisniče"}.
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
                {ui.heroBody}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="bg-secondary/60 text-primary px-2.5 py-1 rounded-full border border-border/50 font-medium">
                  {profile.level}
                </span>
                <span className="text-primary/50 font-script italic">·</span>
                <span className="text-primary/70">{profile.learning_goal}</span>
              </div>
            </div>
            <div className="md:col-span-2 relative min-h-[160px] md:min-h-[240px] border-t md:border-t-0 md:border-l border-border/40">
              <FjordHero className="absolute inset-0 w-full h-full" />
              {/* Tiny stamp on hero */}
              <div className="absolute top-3 right-3 bg-cream/90 backdrop-blur rounded-sm border-2 border-dashed border-primary/40 px-1.5 py-1 rotate-[6deg] shadow-card-soft">
                <div className="font-display text-[8px] font-bold text-primary leading-none">{ui.stampCity}</div>
                <div className="font-script italic text-[8px] text-primary/70 text-center">·1909·</div>
              </div>
            </div>
          </div>
        </motion.div>

        {xpData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <XpProgressCard level={xpData.level} totalXp={xpData.total_xp} />
          </motion.div>
        )}

        <WeeklyDigest />

        <div className="mt-10 mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="font-script italic text-sm text-primary/70 flex items-center gap-2">
            <span className="text-primary/40">✦</span>
            {ui.modulesDivider}
            <span className="text-primary/40">✦</span>
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.route}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.15 }}
              className={mod.fullWidth ? "sm:col-span-2" : ""}
            >
              <Card
                className={`cursor-pointer group h-full bg-cream border border-border/60 shadow-postcard overflow-hidden relative ${mod.rotation} transition-all duration-500 ease-out hover:rotate-0 hover:-translate-y-1.5 hover:shadow-[0_18px_44px_-12px_hsl(350_40%_20%_/_0.25)]`}
                onClick={() => navigate(mod.route)}
              >
                {/* Vignette top */}
                <div className={`relative w-full ${mod.fullWidth ? "h-32 sm:h-36" : "h-28"} overflow-hidden border-b border-border/40`}>
                  <PostcardVignette variant={mod.vignette} className="absolute inset-0 w-full h-full" />
                  {/* Icon medallion */}
                  <div className={`absolute -bottom-5 left-5 w-12 h-12 rounded-2xl ${mod.iconBg} flex items-center justify-center shadow-card-soft ring-2 ring-cream transition-transform duration-300 group-hover:scale-105`}>
                    <mod.icon className="w-5 h-5 text-cream" />
                  </div>
                  {mod.stamp && (
                    <div className="absolute top-2 right-2 bg-cream/95 rounded-sm border-2 border-dashed border-primary/40 px-1.5 py-0.5 rotate-[8deg] shadow-card-soft">
                      <span className="font-display text-[7px] font-bold text-primary tracking-wider">27 KR</span>
                    </div>
                  )}
                </div>

                <CardContent className="pt-8 pb-5 px-5">
                  <p className="font-script italic text-xs text-primary/55 mb-0.5">{mod.subtitle}</p>
                  <h3 className="font-display font-semibold text-lg text-primary leading-tight">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{mod.description}</p>
                  {mod.buttonLabel && (
                    <Button size="sm" variant="hero" className="mt-3">
                      {mod.buttonLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {lessonLoaded && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="mt-8 border-border/50 bg-cream/85 backdrop-blur-sm shadow-card-soft">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck className="w-5 h-5 text-fjord" />
                  <h3 className="font-display font-semibold text-primary">Moji predstojeći časovi</h3>
                </div>
                {upcomingLesson ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(upcomingLesson.start_time), "dd.MM.yyyy HH:mm")} – {format(new Date(upcomingLesson.end_time), "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Zakazano</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/my-lessons")} className="self-start sm:self-auto">
                      Pogledaj detalje
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Nema zakazanih časova.</p>
                    <Button size="sm" variant="hero" onClick={() => navigate("/book-lesson")}>
                      Rezerviši sada
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}
