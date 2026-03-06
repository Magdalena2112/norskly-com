import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, ChevronDown, BookOpen, Brain, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface GrammarSession {
  id: string;
  created_at: string;
  session_type: string;
  topic: string;
  questions: any[];
  user_answers: any[];
  correct_answers: any[];
  score: number;
  total: number;
}

export default function GrammarHistoryTab({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<GrammarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("grammar_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      setSessions((data as any[]) || []);
      setLoading(false);
    })();
  }, [userId]);

  const deleteSession = async (id: string) => {
    await supabase.from("grammar_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Učitavam istoriju...</p>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nemaš završenih sesija.</p>
          <p className="text-xs text-muted-foreground mt-1">Završi vežbe ili kviz da bi se pojavili ovde.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{sessions.length} sesij{sessions.length === 1 ? "a" : "e"} ukupno</p>
      {sessions.map((session) => {
        const pct = session.total > 0 ? Math.round((session.score / session.total) * 100) : 0;
        const isExpanded = expandedId === session.id;
        return (
          <motion.div key={session.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-3"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  session.session_type === "quiz" ? "bg-primary/10" : "bg-accent/10"
                }`}>
                  {session.session_type === "quiz" ? (
                    <Brain className="w-4 h-4 text-primary" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{session.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.created_at), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
                <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"} className="shrink-0">
                  {session.score}/{session.total} ({pct}%)
                </Badge>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                      {(session.questions as any[]).map((q: any, i: number) => {
                        const userAns = (session.user_answers as any[])[i];
                        const correctAns = (session.correct_answers as any[])[i];
                        const isCorrect = typeof userAns === "string" && typeof correctAns === "string"
                          ? userAns.trim().toLowerCase() === correctAns.trim().toLowerCase()
                          : userAns === correctAns;
                        return (
                          <div key={i} className={`p-3 rounded-lg text-sm ${isCorrect ? "bg-accent/5" : "bg-destructive/5"}`}>
                            <div className="flex items-start gap-2">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <p className="text-foreground">{typeof q === "string" ? q : q.question || q.sentence || q.instruction || JSON.stringify(q)}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tvoj odgovor: <span className={isCorrect ? "text-accent" : "text-destructive"}>{String(userAns)}</span>
                                  {!isCorrect && <> · Tačno: <span className="text-accent">{String(correctAns)}</span></>}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive/70 hover:text-destructive text-xs"
                        onClick={() => deleteSession(session.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Obriši sesiju
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
