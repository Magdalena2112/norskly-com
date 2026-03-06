import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertTriangle, BarChart3, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TopicProgress {
  topic: string;
  sessions: number;
  avgScore: number;
  lastPracticed: string;
}

interface WeakTopic {
  topic: string;
  errorCount: number;
  avgSeverity: number;
}

interface WeeklySummary {
  exerciseCount: number;
  avgAccuracy: number;
  topicsPracticed: string[];
}

export default function GrammarProgressTab({ userId }: { userId?: string }) {
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    const [sessionsRes, errorsRes] = await Promise.all([
      supabase
        .from("grammar_sessions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false }),
      supabase
        .from("error_events")
        .select("*")
        .eq("user_id", userId!)
        .eq("module", "grammar")
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
        .order("created_at", { ascending: false }),
    ]);

    const sessions = (sessionsRes.data as any[]) || [];
    const errors = errorsRes.data || [];

    // Topic progress aggregation
    const topicMap = new Map<string, { sessions: number; totalScore: number; totalTotal: number; lastDate: string }>();
    for (const s of sessions) {
      const t = s.topic.toLowerCase().trim();
      const existing = topicMap.get(t) || { sessions: 0, totalScore: 0, totalTotal: 0, lastDate: s.created_at };
      existing.sessions++;
      existing.totalScore += s.score;
      existing.totalTotal += s.total;
      if (s.created_at > existing.lastDate) existing.lastDate = s.created_at;
      topicMap.set(t, existing);
    }
    const progressArr: TopicProgress[] = Array.from(topicMap.entries())
      .map(([topic, d]) => ({
        topic,
        sessions: d.sessions,
        avgScore: d.totalTotal > 0 ? Math.round((d.totalScore / d.totalTotal) * 100) : 0,
        lastPracticed: d.lastDate,
      }))
      .sort((a, b) => b.sessions - a.sessions);
    setTopicProgress(progressArr);

    // Weak topics from errors
    const errorMap = new Map<string, { count: number; totalSev: number }>();
    for (const e of errors) {
      const t = e.topic.toLowerCase().trim();
      const ex = errorMap.get(t) || { count: 0, totalSev: 0 };
      ex.count++;
      ex.totalSev += e.severity;
      errorMap.set(t, ex);
    }
    const weakArr: WeakTopic[] = Array.from(errorMap.entries())
      .map(([topic, d]) => ({
        topic,
        errorCount: d.count,
        avgSeverity: d.count > 0 ? Math.round((d.totalSev / d.count) * 10) / 10 : 1,
      }))
      .sort((a, b) => b.errorCount * b.avgSeverity - a.errorCount * a.avgSeverity)
      .slice(0, 5);
    setWeakTopics(weakArr);

    // Weekly summary
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekSessions = sessions.filter((s) => s.created_at >= weekAgo);
    const weekTopics = [...new Set(weekSessions.map((s) => s.topic))];
    const weekTotalScore = weekSessions.reduce((a, s) => a + s.score, 0);
    const weekTotalTotal = weekSessions.reduce((a, s) => a + s.total, 0);
    setWeeklySummary({
      exerciseCount: weekSessions.length,
      avgAccuracy: weekTotalTotal > 0 ? Math.round((weekTotalScore / weekTotalTotal) * 100) : 0,
      topicsPracticed: weekTopics,
    });

    // Generate recommendations
    const recs: string[] = [];
    if (weakArr.length > 0) {
      recs.push(`Ponovi temu "${weakArr[0].topic}" — imaš ${weakArr[0].errorCount} grešaka u poslednjih 30 dana.`);
    }
    if (weakArr.length > 1) {
      recs.push(`Vežbaj "${weakArr[1].topic}" za bolji rezultat.`);
    }
    const lowScoreTopics = progressArr.filter((t) => t.avgScore < 60).slice(0, 2);
    for (const lt of lowScoreTopics) {
      if (!recs.some((r) => r.includes(lt.topic))) {
        recs.push(`Tema "${lt.topic}" ima prosek ${lt.avgScore}% — probaj ponovo.`);
      }
    }
    if (weekSessions.length === 0) {
      recs.push("Nisi vežbao/la gramatiku ove nedelje — počni sa kratkim kvizom!");
    }
    if (recs.length === 0) {
      recs.push("Odlično napreduješ! Nastavi sa novim temama.");
    }
    setRecommendations(recs.slice(0, 4));

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Analiziram napredak...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Weekly Summary */}
      {weeklySummary && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" /> Nedeljni pregled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklySummary.exerciseCount}</p>
                  <p className="text-xs text-muted-foreground">Sesija</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklySummary.avgAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">Tačnost</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklySummary.topicsPracticed.length}</p>
                  <p className="text-xs text-muted-foreground">Tema</p>
                </div>
              </div>
              {weeklySummary.topicsPracticed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {weeklySummary.topicsPracticed.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Preporuke za učenje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/50">
                  <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                  <span className="text-foreground">{rec}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Progress Map */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" /> Napredak po temama
            </CardTitle>
            <CardDescription className="text-xs">Prosečan rezultat po gramatičkoj temi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Još nema podataka. Završi vežbe ili kviz!</p>
            ) : (
              topicProgress.slice(0, 10).map((tp) => (
                <div key={tp.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium capitalize">{tp.topic}</span>
                    <span className="text-xs text-muted-foreground">
                      {tp.avgScore}% · {tp.sessions} sesij{tp.sessions === 1 ? "a" : "e"}
                    </span>
                  </div>
                  <Progress
                    value={tp.avgScore}
                    className={`h-2 ${tp.avgScore >= 80 ? "[&>div]:bg-accent" : tp.avgScore >= 50 ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"}`}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-destructive/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Slabe tačke
              </CardTitle>
              <CardDescription className="text-xs">Teme sa najviše grešaka u poslednjih 30 dana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakTopics.map((wt) => (
                <div key={wt.topic} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{wt.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {wt.errorCount} grešaka · Težina: {wt.avgSeverity}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => navigate("/grammar", { state: { tab: "exercises", topic: wt.topic } })}
                  >
                    Vežbaj
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
