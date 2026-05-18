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
      <div className="container max-w-3xl py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground mb-1">
            Hei, {profile.name || "korisniče"}! 👋
          </h1>
          <p className="text-primary-foreground/70 mb-4">Izaberi modul i nastavi sa učenjem norveškog.</p>
        </motion.div>

        {xpData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <XpProgressCard level={xpData.level} totalXp={xpData.total_xp} />
          </motion.div>
        )}

        <WeeklyDigest />

        <div className="mt-6"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.route}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={"fullWidth" in mod && mod.fullWidth ? "sm:col-span-2" : ""}
            >
              <Card
                className="cursor-pointer group hover:shadow-nordic transition-all duration-200 hover:-translate-y-0.5 h-full bg-background/80 backdrop-blur-sm border-border/30"
                onClick={() => navigate(mod.route)}
              >
                <CardContent className="pt-6 pb-6 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0`}>
                    <mod.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{mod.description}</p>
                    {"buttonLabel" in mod && (
                      <Button size="sm" variant="hero" className="mt-2">
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
