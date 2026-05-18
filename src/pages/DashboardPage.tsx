import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Languages, MessageSquare, GraduationCap, CalendarCheck } from "lucide-react";
import XpProgressCard from "@/components/XpProgressCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import WeeklyDigest from "@/components/WeeklyDigest";
import { format } from "date-fns";
import StudentLayout from "@/components/student/StudentLayout";

const modules = [
  { title: "Gramatika", subtitle: "Norsk grammatikk", description: "Vežbaj gramatiku kroz kvizove prilagođene tvom nivou.", icon: BookOpen, route: "/grammar", tint: "from-secondary to-secondary/40", iconBg: "bg-primary/90", accent: "primary" },
  { title: "Vokabular", subtitle: "Ord & uttrykk", description: "Uči nove reči sa flashcard sistemom.", icon: Languages, route: "/vocabulary", tint: "from-sunset/40 to-secondary/30", iconBg: "bg-sunset", accent: "sunset" },
  { title: "Razgovor", subtitle: "Snakk med AI", description: "Vežbaj pisanje poruka u realnim situacijama.", icon: MessageSquare, route: "/talk", tint: "from-fjord/30 to-mist", iconBg: "bg-fjord", accent: "fjord" },
  { title: "Razgovor sa profesorom", subtitle: "Lærer-time · 90 min", description: "Rezerviši 90-minutni čas sa profesorom norveškog.", icon: GraduationCap, route: "/book-lesson", tint: "from-forest/25 to-secondary/30", iconBg: "bg-forest", accent: "forest", buttonLabel: "Rezerviši čas", fullWidth: true },
];

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [xpData, setXpData] = useState<{ total_xp: number; level: number } | null>(null);
  const [upcomingLesson, setUpcomingLesson] = useState<{ start_time: string; end_time: string; status: string } | null>(null);
  const [lessonLoaded, setLessonLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: xp }, { data: lesson }] = await Promise.all([
        supabase.from("user_xp").select("total_xp, level").eq("user_id", user.id).maybeSingle(),
        supabase.from("lessons").select("start_time, end_time, status").eq("user_id", user.id).eq("status", "scheduled").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(1).maybeSingle(),
      ]);
      setXpData(xp || { total_xp: 0, level: 1 });
      setUpcomingLesson(lesson);
      setLessonLoaded(true);
    })();
  }, [user]);

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
      <div className="container max-w-3xl py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="font-script italic text-accent-foreground/70 text-sm mb-1">Velkommen tilbake</p>
          <h1 className="text-3xl sm:text-4xl text-display text-primary mb-2">
            Hei, {profile.name || "korisniče"}.
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Izaberi modul i nastavi sa učenjem norveškog — uz prizor norveških fjordova i mirne nordijske atmosfere.
          </p>
        </motion.div>

        {xpData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <XpProgressCard level={xpData.level} totalXp={xpData.total_xp} />
          </motion.div>
        )}

        <WeeklyDigest />

        <div className="mt-8 mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="font-script italic text-sm text-primary/70">Læringsmoduler</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.route}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={"fullWidth" in mod && mod.fullWidth ? "sm:col-span-2" : ""}
            >
              <Card
                className="cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-postcard h-full bg-cream/85 backdrop-blur-sm border border-border/50 shadow-card-soft overflow-hidden relative"
                onClick={() => navigate(mod.route)}
              >
                {/* subtle Nordic tint corner */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mod.tint} opacity-60 pointer-events-none`} />
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-gradient-to-bl from-cream/70 to-transparent pointer-events-none" />

                <CardContent className="pt-6 pb-6 flex items-start gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl ${mod.iconBg} flex items-center justify-center shrink-0 shadow-card-soft ring-1 ring-cream/50 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[-3deg]`}>
                    <mod.icon className="w-6 h-6 text-cream" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-script italic text-xs text-primary/60 mb-0.5">{mod.subtitle}</p>
                    <h3 className="font-display font-semibold text-lg text-primary group-hover:text-primary/80 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{mod.description}</p>
                    {"buttonLabel" in mod && (
                      <Button size="sm" variant="hero" className="mt-3">
                        {(mod as any).buttonLabel}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {lessonLoaded && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="mt-6 border-accent/20 bg-background/80 backdrop-blur-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Moji predstojeći časovi</h3>
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
