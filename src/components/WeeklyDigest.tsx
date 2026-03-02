import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, ChevronRight, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TopicStat {
  topic: string;
  category: string;
  module: string;
  count: number;
  avgSeverity: number;
  score: number;
}

const MODULE_LABELS: Record<string, string> = {
  grammar: "Gramatika",
  vocabulary: "Vokabular",
  talk: "Razgovor",
};

export default function WeeklyDigest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TopicStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const dismissKey = `weekly_digest_dismissed_${user.id}`;
    const stored = localStorage.getItem(dismissKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (parsed.timestamp > weekAgo) {
        setDismissed(true);
        setLoading(false);
        return;
      }
    }

    (async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("error_events")
        .select("topic, category, severity, module")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) {
        console.error("Weekly digest fetch error:", error);
        setLoading(false);
        return;
      }

      const topicMap = new Map<string, { count: number; totalSev: number; category: string; module: string }>();
      for (const row of data || []) {
        const existing = topicMap.get(row.topic);
        if (existing) {
          existing.count++;
          existing.totalSev += row.severity;
        } else {
          topicMap.set(row.topic, { count: 1, totalSev: row.severity, category: row.category, module: row.module });
        }
      }

      const results: TopicStat[] = Array.from(topicMap.entries())
        .map(([topic, v]) => ({
          topic,
          category: v.category,
          module: v.module,
          count: v.count,
          avgSeverity: Math.round((v.totalSev / v.count) * 10) / 10,
          score: v.count * (v.totalSev / v.count),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setStats(results);
      setLoading(false);
    })();
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(
        `weekly_digest_dismissed_${user.id}`,
        JSON.stringify({ timestamp: Date.now() })
      );
    }
    setDismissed(true);
  };

  const totalErrors = useMemo(() => stats.reduce((sum, s) => sum + s.count, 0), [stats]);

  if (dismissed || loading || stats.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-accent/30 bg-accent/5 shadow-nordic">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Nedeljni pregled
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalErrors} {totalErrors === 1 ? "greška" : totalErrors < 5 ? "greške" : "grešaka"} ove nedelje — evo gde da se fokusiraš:
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.topic}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border"
              >
                <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{stat.topic}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {MODULE_LABELS[stat.module] || stat.module} · {stat.count}× · ozbiljnost {stat.avgSeverity}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => navigate("/grammar", { state: { tab: "explain", query: stat.topic } })}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs mt-2"
              onClick={() => navigate("/progress")}
            >
              Pogledaj detaljan napredak →
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
