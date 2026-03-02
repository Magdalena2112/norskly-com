import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Languages, MessageSquare, TrendingUp, Settings, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import WeeklyDigest from "@/components/WeeklyDigest";

const XP_TITLES: Record<number, string> = {
  1: "Utforsker",
  2: "Lærling",
  3: "Kommunikatør",
  4: "Taler",
  5: "Trygg taler",
  6: "Avansert kommunikatør",
  7: "Flytende",
  8: "Dyktig",
  9: "Ekspert",
  10: "Norskly-mester",
};

const modules = [
  {
    title: "Gramatika",
    description: "Vežbaj gramatiku kroz kvizove prilagođene tvom nivou.",
    icon: BookOpen,
    route: "/grammar",
    gradient: "from-primary to-primary/70",
  },
  {
    title: "Vokabular",
    description: "Uči nove reči sa flashcard sistemom.",
    icon: Languages,
    route: "/vocabulary",
    gradient: "from-accent to-accent/70",
  },
  {
    title: "Razgovor",
    description: "Vežbaj pisanje poruka u realnim situacijama.",
    icon: MessageSquare,
    route: "/talk",
    gradient: "from-primary to-accent",
  },
  {
    title: "Napredak",
    description: "Prati svoj napredak i postignuća.",
    icon: TrendingUp,
    route: "/progress",
    gradient: "from-accent to-primary",
  },
];

export default function DashboardPage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [xpData, setXpData] = useState<{ total_xp: number; level: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_xp")
        .select("total_xp, level")
        .eq("user_id", user.id)
        .maybeSingle();
      setXpData(data || { total_xp: 0, level: 1 });
    })();
  }, [user]);

  const xpInLevel = xpData ? xpData.total_xp % 100 : 0;
  const xpForNext = 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-lg text-foreground">Norskly</span>
          <div className="flex items-center gap-2">
            {xpData && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" /> Lvl {xpData.level} · {xpData.total_xp} XP
              </span>
            )}
            <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {profile.level} · {profile.learning_goal}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigate("/onboarding")}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 container max-w-3xl py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            Hei, {profile.name || "korisniče"}! 👋
          </h1>
          <p className="text-muted-foreground mb-4">Izaberi modul i nastavi sa učenjem norveškog.</p>
        </motion.div>

        {/* XP Progress Card */}
        {xpData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="mb-6 shadow-nordic border-primary/15 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {xpData.level}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Level {xpData.level}</p>
                      <p className="text-[11px] text-muted-foreground">{xpData.total_xp} ukupno XP</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{xpInLevel}/{xpForNext} XP do sledećeg nivoa</p>
                </div>
                <Progress value={(xpInLevel / xpForNext) * 100} className="h-2.5" />
              </CardContent>
            </Card>
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
            >
              <Card
                className="cursor-pointer group hover:shadow-nordic transition-all duration-200 hover:-translate-y-0.5"
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
