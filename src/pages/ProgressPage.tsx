import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, BookOpen, MessageSquare, Brain, TrendingUp,
  AlertTriangle, Search, PenTool, Loader2, Sparkles, Award, ArrowUpCircle,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

const levelProgress: Record<string, number> = {
  A1: 10, A2: 30, B1: 50, B2: 70, C1: 90,
};

interface ErrorTopicStat {
  topic: string;
  category: string;
  count: number;
  avgSeverity: number;
  score: number;
  module: string;
}

const MODULE_LABELS: Record<string, string> = {
  grammar: "Gramatika",
  vocabulary: "Vokabular",
  talk: "Razgovor",
};

const SEVERITY_LABELS: Record<number, string> = {
  1: "Mala",
  2: "Srednja",
  3: "Velika",
};

export default function ProgressPage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [errorStats, setErrorStats] = useState<ErrorTopicStat[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingErrors(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("error_events")
        .select("topic, category, severity, module")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error) {
        console.error("Failed to fetch error events:", error);
        setLoadingErrors(false);
        return;
      }

      // Aggregate by topic
      const topicMap = new Map<string, { count: number; totalSeverity: number; category: string; module: string }>();
      for (const row of data || []) {
        const key = row.topic;
        const existing = topicMap.get(key);
        if (existing) {
          existing.count++;
          existing.totalSeverity += row.severity;
        } else {
          topicMap.set(key, { count: 1, totalSeverity: row.severity, category: row.category, module: row.module });
        }
      }

      const stats: ErrorTopicStat[] = Array.from(topicMap.entries()).map(([topic, v]) => ({
        topic,
        category: v.category,
        count: v.count,
        avgSeverity: Math.round((v.totalSeverity / v.count) * 10) / 10,
        score: v.count * (v.totalSeverity / v.count),
        module: v.module,
      }));

      stats.sort((a, b) => b.score - a.score);
      setErrorStats(stats);
      setLoadingErrors(false);
    })();
  }, [user]);

  const topRecommendations = useMemo(() => errorStats.slice(0, 3), [errorStats]);

  const stats = [
    { label: "Nivo", value: profile.level, icon: TrendingUp, color: "text-accent" },
    { label: "Cilj učenja", value: profile.learning_goal, icon: Brain, color: "text-primary" },
    { label: "Fokus", value: profile.focus_area, icon: BookOpen, color: "text-accent" },
    { label: "Samopouzdanje", value: `${profile.confidence_level}/5`, icon: MessageSquare, color: "text-primary" },
  ];

  const milestones = [
    { level: "A1", label: "Početnik", desc: "Osnovni pozdravi i fraze" },
    { level: "A2", label: "Elementarni", desc: "Svakodnevne situacije" },
    { level: "B1", label: "Srednji", desc: "Samostalna komunikacija" },
    { level: "B2", label: "Viši srednji", desc: "Složene teme" },
    { level: "C1", label: "Napredni", desc: "Tečna komunikacija" },
  ];

  const getRecommendationText = (stat: ErrorTopicStat) => {
    if (stat.avgSeverity >= 2.5) {
      return `Ova tema zahteva pažljivu reviziju. Preporučujemo da počnete sa objašnjenjem pravila, pa onda vežbama.`;
    }
    if (stat.count >= 5) {
      return `Česta greška — ponavljanje kroz vežbe i kvizove će pomoći da se uspostavi automatizam.`;
    }
    return `Povremena greška — kratka sesija vežbi bi trebalo da bude dovoljna za učvršćivanje.`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Moj napredak</span>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-8 space-y-8">
        {/* Overall progress */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-nordic">
            <CardHeader>
              <CardTitle className="text-lg">Ukupni napredak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>A1</span>
                <span>C1</span>
              </div>
              <Progress value={levelProgress[profile.level] || 10} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                Trenutni nivo: <span className="font-semibold text-accent">{profile.level}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-5 pb-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold text-foreground capitalize text-sm">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ═══ Error Analysis Section ═══ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-nordic">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Najčešće greške (poslednjih 30 dana)
              </CardTitle>
              <CardDescription>Analiza grešaka iz svih modula</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                </div>
              ) : errorStats.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-muted-foreground text-sm">Nema zabeleženih grešaka.</p>
                  <p className="text-xs text-muted-foreground">Greške se beleže automatski tokom vežbi, korekcija i razgovora.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errorStats.slice(0, 8).map((stat, i) => (
                    <motion.div
                      key={stat.topic + stat.category}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-muted/50 border border-border space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-sm">{stat.topic}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                              {MODULE_LABELS[stat.module] || stat.module}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {stat.category.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-destructive">{stat.count}×</p>
                          <p className="text-[10px] text-muted-foreground">
                            Ozbiljnost: {SEVERITY_LABELS[Math.round(stat.avgSeverity)] || stat.avgSeverity.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-7"
                          onClick={() => navigate("/grammar", { state: { tab: "explain", query: stat.topic } })}
                        >
                          <Search className="w-3 h-3" /> Objašnjenje
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-7"
                          onClick={() => navigate("/grammar", { state: { tab: "exercises", topic: stat.topic } })}
                        >
                          <PenTool className="w-3 h-3" /> Vežbe
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 h-7"
                          onClick={() => navigate("/grammar", { state: { tab: "quiz", topic: stat.topic } })}
                        >
                          <Brain className="w-3 h-3" /> Kviz
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══ Recommendations Section ═══ */}
        {topRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="shadow-nordic border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Preporuke za obnavljanje
                </CardTitle>
                <CardDescription>Top 3 teme za fokusiran rad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topRecommendations.map((rec, i) => (
                  <motion.div
                    key={rec.topic}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-4 rounded-xl bg-background border border-border space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <p className="font-medium text-foreground text-sm">{rec.topic}</p>
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">
                      {getRecommendationText(rec)}
                    </p>
                    <div className="pl-8 flex gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => navigate("/grammar", { state: { tab: "explain", query: rec.topic } })}
                      >
                        Započni reviziju →
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-nordic">
            <CardHeader>
              <CardTitle className="text-lg">Miljokazi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((m) => {
                  const reached = milestones.findIndex((x) => x.level === profile.level) >= milestones.findIndex((x) => x.level === m.level);
                  return (
                    <div key={m.level} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${reached ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {m.level}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      {reached && <span className="text-accent text-xs">✓</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-foreground font-medium mb-1">💡 Savet za {profile.level}</p>
            <p className="text-sm text-muted-foreground">
              {profile.level === "A1" && "Fokusiraj se na učenje najčešćih 100 reči. One pokrivaju ~50% svakodnevnog govora!"}
              {profile.level === "A2" && "Počni da čitaš kratke norveške tekstove i pokušaj da prepoznaješ obrasce."}
              {profile.level === "B1" && "Gledaj norveške serije sa titlovima. NRK ima odličan besplatan sadržaj!"}
              {profile.level === "B2" && "Počni da pišeš kraće tekstove na norveškom — blogove, dnevnike, mejlove."}
              {profile.level === "C1" && "Uključi se u norveške diskusione grupe i forume za autentičnu praksu."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
