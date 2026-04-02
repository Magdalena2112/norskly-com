import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Loader2, BookOpen, PenTool, Brain, Eye, EyeOff, Search, Lightbulb, AlertTriangle, History, TrendingUp, Bookmark, BookmarkCheck, X, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/logActivity";
import { logErrors } from "@/lib/logErrors";
import { useIsMobile } from "@/hooks/use-mobile";
import GrammarHistoryTab from "@/components/grammar/GrammarHistoryTab";
import GrammarProgressTab from "@/components/grammar/GrammarProgressTab";

// ─── Types ───
interface Exercise {
  id: number;
  instruction: string;
  sentence: string;
  solution: string;
  hint: string;
}

interface Mistake {
  original: string;
  corrected: string;
  explanation: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ─── AI call helper ───
async function callGrammarAI(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("grammar-ai", {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message || "AI request failed");
  return res.data;
}

export default function GrammarPage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const level = profile.level || "A1";

  // Accept navigation state from Progress page
  const navState = (location.state as { tab?: string; query?: string; topic?: string }) || {};
  const defaultTab = navState.tab || "exercises";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [explainTopic, setExplainTopic] = useState("");

  const goToExplainTab = (topicText: string) => {
    setExplainTopic(topicText);
    setActiveTab("explain");
  };

  return (
    <div className="min-h-screen bg-aurora flex flex-col">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")} className="text-primary-foreground hover:text-primary-foreground/80">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-primary-foreground">Gramatika</span>
          <span className="ml-auto text-xs bg-primary-foreground/15 text-primary-foreground px-3 py-1 rounded-full font-medium">
            Nivo {level}
          </span>
        </div>
      </header>

      <div className={`flex-1 container py-6 ${activeTab === "explain" ? "max-w-5xl" : "max-w-2xl"}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="exercises" className="gap-1 text-xs flex-1 min-w-0">
              <BookOpen className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Vežbe
            </TabsTrigger>
            <TabsTrigger value="correction" className="gap-1 text-xs flex-1 min-w-0">
              <PenTool className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Korekcija
            </TabsTrigger>
            <TabsTrigger value="explain" className="gap-1 text-xs flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Objašnjenja
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1 text-xs flex-1 min-w-0">
              <Brain className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Kviz
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 text-xs flex-1 min-w-0">
              <History className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Istorija
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 text-xs flex-1 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Napredak
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises">
            <ExercisesTab level={level} userId={user?.id} initialTopic={navState.tab === "exercises" ? navState.topic : undefined} onGoToExplain={goToExplainTab} />
          </TabsContent>
          <TabsContent value="correction">
            <CorrectionTab level={level} userId={user?.id} />
          </TabsContent>
          <TabsContent value="explain">
            <ExplainTab level={level} userId={user?.id} initialQuery={explainTopic || (navState.tab === "explain" ? navState.query : undefined)} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab level={level} userId={user?.id} initialTopic={navState.tab === "quiz" ? navState.topic : undefined} />
          </TabsContent>
          <TabsContent value="history">
            <GrammarHistoryTab userId={user?.id} />
          </TabsContent>
          <TabsContent value="progress">
            <GrammarProgressTab userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 1: Generate Exercises (Error Mirror)
// ═══════════════════════════════════════
interface ExerciseState {
  answer: string;
  attempts: number;
  status: "pending" | "correct" | "revealed";
  feedback: string;
  logged: boolean;
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function getHint(attempt: number, solution: string, answer: string): string {
  const hints = [
    "Obrati pažnju na oblik reči.",
    "Razmisli o redosledu reči u rečenici.",
    "Pogledaj da li je potreban određeni član ili predlog.",
  ];
  if (attempt === 1) return hints[0];
  if (attempt === 2) return "Blizu si! Proveri još jednom pravopis i oblik.";
  return hints[Math.min(attempt - 1, hints.length - 1)];
}

function ExercisesTab({ level, userId, initialTopic, onGoToExplain }: { level: string; userId?: string; initialTopic?: string; onGoToExplain?: (topic: string) => void }) {
  const [topic, setTopic] = useState(initialTopic || "");
  const [count, setCount] = useState(5);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [states, setStates] = useState<ExerciseState[]>([]);
  const [loading, setLoading] = useState(false);
  const [exerciseXpLogged, setExerciseXpLogged] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setExercises([]);
    setStates([]);
    setExerciseXpLogged(false);
    try {
      // Fetch previous sentences to avoid repetition
      let previousSentences: string[] = [];
      if (userId) {
        const { data: pastSessions } = await supabase
          .from("grammar_sessions")
          .select("questions")
          .eq("user_id", userId)
          .eq("topic", topic.trim())
          .order("created_at", { ascending: false })
          .limit(5);
        if (pastSessions) {
          previousSentences = pastSessions.flatMap((s: any) => {
            const qs = Array.isArray(s.questions) ? s.questions : [];
            return qs.map((q: any) => q.sentence || q.question || "").filter(Boolean);
          }).slice(0, 30);
        }
      }
      const data = await callGrammarAI({ action: "generate_exercises", level, topic: topic.trim(), count, unique_seed: Date.now(), previous_sentences: previousSentences });
      const exs = data.exercises || [];
      setExercises(exs);
      setStates(exs.map(() => ({ answer: "", attempts: 0, status: "pending" as const, feedback: "", logged: false })));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateState = (i: number, patch: Partial<ExerciseState>) => {
    setStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const checkAnswer = async (i: number) => {
    const ex = exercises[i];
    const st = states[i];
    const userAns = normalizeAnswer(st.answer);
    const correctAns = normalizeAnswer(ex.solution);

    if (userAns === correctAns) {
      updateState(i, { status: "correct", feedback: "Odlično! Tačan odgovor. 🎉", attempts: st.attempts + 1 });
      if (userId && !st.logged) {
        updateState(i, { logged: true });
      }
    } else {
      const newAttempts = st.attempts + 1;
      // Log error on each wrong attempt
      if (userId) {
        await logErrors(userId, "grammar", "exercise_check", [{
          category: "exercise_mistake",
          topic: topic || "grammar exercise",
          severity: newAttempts >= 3 ? 2 : 1,
          example_wrong: st.answer,
          example_correct: ex.solution,
        }], ex.sentence, newAttempts);
      }
      if (newAttempts >= 3) {
        updateState(i, { status: "revealed", attempts: newAttempts, feedback: "" });
        if (userId && !st.logged) {
          updateState(i, { logged: true });
        }
      } else {
        const hint = getHint(newAttempts, ex.solution, st.answer);
        updateState(i, { attempts: newAttempts, feedback: hint });
      }
    }
  };

  const reveal = (i: number) => {
    updateState(i, { status: "revealed", feedback: "" });
  };

  const allDone = states.length > 0 && states.every((s) => s.status !== "pending");

  // Award XP when all exercises are completed
  React.useEffect(() => {
    if (allDone && userId && !exerciseXpLogged && states.length > 0) {
      const correctCount = states.filter((s) => s.status === "correct").length;
      const pct = (correctCount / states.length) * 100;
      const bonus = pct >= 80 ? 5 : 0;
      logActivity(userId, "grammar", "exercises_completed", 10 + bonus, {
        topic,
        correct: correctCount,
        total: states.length,
        percentage: pct,
      }, { dedupKey: `grammar_ex_${topic}_${Date.now()}`, checkDailyBonus: true });
      // Save session to grammar_sessions
      supabase.from("grammar_sessions").insert({
        user_id: userId,
        session_type: "exercise",
        topic,
        questions: exercises.map((e) => ({ instruction: e.instruction, sentence: e.sentence })),
        user_answers: states.map((s) => s.answer || (s.status === "revealed" ? "(prikazano)" : "")),
        correct_answers: exercises.map((e) => e.solution),
        score: correctCount,
        total: states.length,
      } as any).then(() => {});
      setExerciseXpLogged(true);
    }
  }, [allDone]);

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Generiši vežbe</CardTitle>
          <CardDescription>Unesite temu i broj zadataka.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tema</label>
            <Input
              placeholder="npr. prezent, članovi, predlozi..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Broj zadataka</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
          <Button variant="hero" className="w-full" onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generišem...</> : "Generiši vežbe"}
          </Button>
        </CardContent>
      </Card>

      {exercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {exercises.map((ex, i) => {
            const st = states[i];
            if (!st) return null;
            return (
              <Card key={ex.id || i}>
                <CardContent className="pt-5 pb-5 space-y-3">
                  <p className="text-xs text-accent font-medium uppercase tracking-wider">Zadatak {i + 1}</p>
                  <p className="text-sm text-muted-foreground">{ex.instruction}</p>
                  <p className="text-foreground font-medium">{ex.sentence}</p>

                  {st.status === "correct" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-accent/10">
                      <p className="text-sm font-medium text-accent flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {st.feedback}
                      </p>
                    </motion.div>
                  )}

                  {st.status === "revealed" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium text-foreground">Rešenje: <span className="text-accent">{ex.solution}</span></p>
                    </motion.div>
                  )}

                  {st.status === "pending" && (
                    <>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tvoj odgovor..."
                          value={st.answer}
                          onChange={(e) => updateState(i, { answer: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && st.answer.trim() && checkAnswer(i)}
                          className="flex-1"
                        />
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => checkAnswer(i)}
                          disabled={!st.answer.trim()}
                        >
                          Proveri
                        </Button>
                      </div>

                      {st.feedback && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm text-foreground flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-accent shrink-0" />
                            {st.feedback}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Pokušaj {st.attempts}/3</p>
                        </motion.div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => reveal(i)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Prikaži rešenje
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {allDone && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="pt-5 pb-5 text-center space-y-3">
                  <p className="text-sm font-medium text-accent">
                    ✅ Sve vežbe završene! Tačno: {states.filter((s) => s.status === "correct").length}/{states.length}
                  </p>
                  {onGoToExplain && topic && (
                    <Button variant="outline" size="sm" onClick={() => onGoToExplain(topic)}>
                      <BookOpen className="w-4 h-4 mr-1" /> Objasni: {topic}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 2: Text Correction
// ═══════════════════════════════════════
function CorrectionTab({ level, userId }: { level: string; userId?: string }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{
    corrected_text: string;
    mistakes: Mistake[];
    overall_feedback: string;
    nivo_analiza?: {
      gramatika?: string;
      vokabular?: string;
      jasnoća?: string;
      povezivanje?: string;
      prirodnost?: string;
    };
    sledeci_korak?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  const correct = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setLogged(false);
    try {
      const data = await callGrammarAI({ action: "correct_text", level, text: text.trim() });
      setResult(data);
      if (userId) {
        // Log structured errors from AI (no XP for content generation)
        if (data._errors?.length) {
          await logErrors(userId, "grammar", "text_correction", data._errors.slice(0, 5));
        }
        setLogged(true);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Korekcija teksta</CardTitle>
          <CardDescription>Napišite tekst na norveškom, AI će ga ispraviti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Napišite tekst na norveškom ovde..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={2000}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{text.length}/2000</span>
            <Button variant="hero" onClick={correct} disabled={loading || !text.trim()}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analiziram...</> : "Ispravi tekst"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ispravljena verzija</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground bg-accent/5 p-4 rounded-lg border border-accent/20 leading-relaxed">
                {result.corrected_text}
              </p>
            </CardContent>
          </Card>

          {result.mistakes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Greške ({result.mistakes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.mistakes.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted space-y-1">
                    <div className="flex gap-2 text-sm">
                      <span className="text-destructive line-through">{m.original}</span>
                      <span className="text-accent">→ {m.corrected}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.overall_feedback && (
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-foreground">{result.overall_feedback}</p>
              </CardContent>
            </Card>
          )}

          {result.nivo_analiza && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📊 Nivo analiza</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Gramatika", value: result.nivo_analiza.gramatika },
                    { label: "Vokabular", value: result.nivo_analiza.vokabular },
                    { label: "Jasnoća", value: result.nivo_analiza.jasnoća },
                    { label: "Povezivanje", value: result.nivo_analiza.povezivanje },
                    { label: "Prirodnost", value: result.nivo_analiza.prirodnost },
                  ].map((dim) => (
                    dim.value && (
                      <div key={dim.label} className="flex gap-2 items-start text-sm">
                        <span className="font-medium text-foreground min-w-[100px]">{dim.label}:</span>
                        <span className="text-muted-foreground">{dim.value}</span>
                      </div>
                    )
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result.sledeci_korak && result.sledeci_korak.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">🎯 Sledeći korak u učenju</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.sledeci_korak.map((step, i) => (
                    <div key={i} className="flex gap-2 items-start text-sm">
                      <span className="text-accent font-bold">{i + 1}.</span>
                      <span className="text-foreground">{step}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {logged && (
            <p className="text-center text-xs text-accent font-medium">✅ +12 poena zabeleženo</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 3: Objašnjenja (Free-form topic search)
// ═══════════════════════════════════════
interface ExplainSimpleExample { no: string; sr: string; }
interface ExplainLifeExample { no: string; sr: string; kontekst?: string; }
interface ExplainContrastExample { pogresno: string; tacno: string; objasnjenje: string; }
interface ExplainMistake { pogresno: string; tacno: string; objasnjenje: string; }
interface ExplainFormula { label: string; pattern: string; examples: string[]; }
interface ExplainComparison {
  title: string;
  left_label: string;
  right_label: string;
  rows: { left: string; right: string; note: string }[];
}
interface ExplainResult {
  naslov: string;
  sazetak?: string;
  definicija: string;
  formula?: ExplainFormula | null;
  kada_se_koristi?: string[];
  kada_se_ne_koristi?: string[];
  poredjenje?: ExplainComparison | null;
  primeri?: {
    jednostavni?: ExplainSimpleExample[];
    iz_zivota?: ExplainLifeExample[];
    kontrastni?: ExplainContrastExample[];
  } | ExplainSimpleExample[];
  tipicne_greske?: ExplainMistake[];
  mini_savet?: string;
  povezane_teme?: string[];
  // Legacy fields
  upotreba?: string;
}

interface SavedExplanation {
  id: string;
  title: string;
  query: string;
  explanation_data: ExplainResult;
  created_at: string;
}

function SavedSidebar({ saved, onLoad, onRemove }: { saved: SavedExplanation[]; onLoad: (s: SavedExplanation) => void; onRemove: (id: string) => void }) {
  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bookmark className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Još nema sačuvanih objašnjenja</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Sačuvaj objašnjenje klikom na ⭐</p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {saved.map((s) => (
        <div key={s.id} className="flex items-center gap-1 group">
          <button
            onClick={() => onLoad(s)}
            className="flex-1 text-left text-sm px-3 py-2 rounded-md hover:bg-muted transition-colors truncate text-foreground"
          >
            {s.title}
          </button>
          <button
            onClick={() => onRemove(s.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all shrink-0"
            title="Ukloni"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ExplainTab({ level, userId, initialQuery }: { level: string; userId?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);
  const [savedExplanations, setSavedExplanations] = useState<SavedExplanation[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const isMobile = useIsMobile();

  // Load saved explanations
  const fetchSaved = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("saved_explanations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setSavedExplanations(data.map((d: any) => ({ ...d, explanation_data: d.explanation_data as ExplainResult })));
  }, [userId]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const isSaved = result ? savedExplanations.some((s) => s.query === query.trim().toLowerCase()) : false;

  const toggleSave = async () => {
    if (!userId || !result) return;
    const normalizedQuery = query.trim().toLowerCase();
    if (isSaved) {
      const item = savedExplanations.find((s) => s.query === normalizedQuery);
      if (item) {
        await supabase.from("saved_explanations").delete().eq("id", item.id);
        await fetchSaved();
      }
    } else {
      await supabase.from("saved_explanations").insert({
        user_id: userId,
        title: result.naslov || query.trim(),
        query: normalizedQuery,
        explanation_data: result as any,
      });
      await fetchSaved();
    }
  };

  const loadSaved = (s: SavedExplanation) => {
    setQuery(s.query);
    setResult(s.explanation_data);
    setLogged(true);
  };

  const removeSaved = async (id: string) => {
    await supabase.from("saved_explanations").delete().eq("id", id);
    await fetchSaved();
  };

  // Auto-search when initialQuery changes
  React.useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  React.useEffect(() => {
    if (query && !result && !loading) {
      search();
    }
  }, [query]);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setLogged(false);
    try {
      const data = await callGrammarAI({ action: "explain_topic", level, text: query.trim() });
      setResult(data);
      if (userId) setLogged(true);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchTopic = (topic: string) => {
    setQuery(topic);
    setResult(null);
    setLogged(false);
  };

  // Normalize examples (handle legacy array format)
  const getExamples = () => {
    if (!result?.primeri) return null;
    if (Array.isArray(result.primeri)) {
      return { jednostavni: result.primeri as ExplainSimpleExample[], iz_zivota: [], kontrastni: [] };
    }
    return result.primeri;
  };

  const mainContent = (
    <div className="space-y-4 flex-1 min-w-0">
      <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
        <CardHeader>
          <CardTitle className="text-lg">Objašnjenja gramatike</CardTitle>
          <CardDescription>
            Postavite bilo koje pitanje o norveškoj gramatici — na srpskom ili norveškom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder='npr. "leddsetninger med fordi", "razlika između for i til"...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className="pl-10"
              maxLength={200}
            />
          </div>
          <Button variant="hero" className="w-full" onClick={search} disabled={loading || !query.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Tražim objašnjenje...</> : "Objasni"}
          </Button>
        </CardContent>
      </Card>

      {/* Mobile: collapsible saved list */}
      {isMobile && (
        <Collapsible open={savedOpen} onOpenChange={setSavedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" /> Sačuvana objašnjenja ({savedExplanations.length})
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${savedOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-2">
              <CardContent className="pt-4 pb-3">
                <SavedSidebar saved={savedExplanations} onLoad={loadSaved} onRemove={removeSaved} />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Title + Bookmark */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-5 pb-5 flex items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-foreground">{result.naslov}</h3>
              {userId && (
                <Button variant="ghost" size="icon" onClick={toggleSave} className="shrink-0" title={isSaved ? "Ukloni iz sačuvanih" : "Sačuvaj objašnjenje"}>
                  {isSaved ? <BookmarkCheck className="w-5 h-5 text-accent" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 1️⃣ Quick Summary */}
          {result.sazetak && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-foreground leading-relaxed">{result.sazetak}</p>
              </CardContent>
            </Card>
          )}

          {/* 2️⃣ Detailed Definition */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" /> Definicija
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result.definicija}</p>
            </CardContent>
          </Card>

          {/* 3️⃣ Formula Block */}
          {result.formula && (
            <Card className="border-accent/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-accent">📐</span> Gramatički obrazac: {result.formula.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="font-mono text-sm text-foreground font-semibold text-center">{result.formula.pattern}</p>
                </div>
                {result.formula.examples?.length > 0 && (
                  <div className="space-y-1">
                    {result.formula.examples.map((ex, i) => (
                      <p key={i} className="text-sm text-muted-foreground pl-2 border-l-2 border-accent/30">{ex}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4️⃣ When Used */}
          {result.kada_se_koristi && result.kada_se_koristi.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" /> Kada se koristi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.kada_se_koristi.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Legacy: upotreba (for old format) */}
          {!result.kada_se_koristi && result.upotreba && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" /> Kako se koristi u praksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground leading-relaxed">{result.upotreba}</p>
              </CardContent>
            </Card>
          )}

          {/* 5️⃣ When NOT Used */}
          {result.kada_se_ne_koristi && result.kada_se_ne_koristi.length > 0 && (
            <Card className="bg-destructive/5 border-destructive/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" /> Kada se NE koristi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.kada_se_ne_koristi.map((item, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 6️⃣ Comparison Table */}
          {result.poredjenje && result.poredjenje.rows?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>⚖️</span> {result.poredjenje.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-semibold text-accent">{result.poredjenje.left_label}</th>
                        <th className="text-left py-2 px-3 font-semibold text-accent">{result.poredjenje.right_label}</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Napomena</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.poredjenje.rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground">{row.left}</td>
                          <td className="py-2 px-3 text-foreground">{row.right}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7️⃣ Examples — 3 sub-sections */}
          {(() => {
            const examples = getExamples();
            if (!examples) return null;
            const hasSimple = examples.jednostavni && examples.jednostavni.length > 0;
            const hasLife = examples.iz_zivota && examples.iz_zivota.length > 0;
            const hasContrast = examples.kontrastni && examples.kontrastni.length > 0;
            if (!hasSimple && !hasLife && !hasContrast) return null;
            return (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>📝</span> Primeri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasSimple && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jednostavni primeri</p>
                      {examples.jednostavni!.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted space-y-1">
                          <p className="text-sm font-medium text-foreground">{p.no}</p>
                          <p className="text-xs text-muted-foreground">{p.sr}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasLife && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primeri iz života</p>
                      {examples.iz_zivota!.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-accent/5 border border-accent/10 space-y-1">
                          <p className="text-sm font-medium text-foreground">{p.no}</p>
                          <p className="text-xs text-muted-foreground">{p.sr}</p>
                          {p.kontekst && <p className="text-xs text-accent italic">📌 {p.kontekst}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {hasContrast && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kontrastni primeri</p>
                      {examples.kontrastni!.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 space-y-1">
                          <div className="flex gap-2 text-sm">
                            <span className="text-destructive line-through">{p.pogresno}</span>
                            <span className="text-accent">→ {p.tacno}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.objasnjenje}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* 8️⃣ Common Mistakes */}
          {result.tipicne_greske && result.tipicne_greske.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" /> Tipične greške
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.tipicne_greske.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 space-y-1">
                    <div className="flex gap-2 text-sm">
                      <span className="text-destructive line-through">{m.pogresno}</span>
                      <span className="text-accent">→ {m.tacno}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.objasnjenje}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 9️⃣ Memory Tip */}
          {result.mini_savet && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-5 pb-5 flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Savet za pamćenje</p>
                  <p className="text-sm text-foreground">{result.mini_savet}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🔗 Related Topics */}
          {result.povezane_teme && result.povezane_teme.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>🔗</span> Povezane teme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.povezane_teme.map((t, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => searchTopic(t)} className="text-xs">
                      {t}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {logged && (
            <p className="text-center text-xs text-accent font-medium">✅ Objašnjenje učitano</p>
          )}
        </motion.div>
      )}
    </div>
  );

  // Desktop: flex layout with sidebar
  if (!isMobile) {
    return (
      <div className="flex gap-6">
        {mainContent}
        <div className="w-64 shrink-0">
          <div className="sticky top-20">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-accent" /> Sačuvana objašnjenja
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <SavedSidebar saved={savedExplanations} onLoad={loadSaved} onRemove={removeSaved} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return mainContent;
}

// ═══════════════════════════════════════
// TAB 4: Mini Quiz
// ═══════════════════════════════════════
function QuizTab({ level, userId, initialTopic }: { level: string; userId?: string; initialTopic?: string }) {
  const [topic, setTopic] = useState(initialTopic || "");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setCurrent(0);
    setAnswers([]);
    setScore(0);
    setFinished(false);
    setLogged(false);
    try {
      const data = await callGrammarAI({ action: "generate_quiz", level, topic: topic.trim() });
      setQuestions(data.questions || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswers((prev) => [...prev, idx]);
    if (idx === questions[current].correct) {
      setScore((s) => s + 1);
    } else if (userId) {
      // Log quiz wrong answer error
      const q = questions[current];
      const errorData = (q as any)._error;
      if (errorData) {
        await logErrors(userId, "grammar", "quiz", [{
          category: errorData.category || "quiz_mistake",
          topic: errorData.topic || topic,
          severity: errorData.severity || 1,
          example_wrong: errorData.example_wrong || q.options[idx],
          example_correct: errorData.example_correct || q.options[q.correct],
        }]);
      }
    }
  };

  const handleNext = async () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      // Log activity
      if (userId && !logged) {
        const finalScore = selected === questions[current].correct ? score + 1 : score;
        const pct = (finalScore / questions.length) * 100;
        const bonus = pct >= 80 ? 5 : 0;
        await logActivity(userId, "grammar", "quiz_completed", 15 + bonus, {
          topic,
          score: finalScore,
          total: questions.length,
          percentage: pct,
        }, { dedupKey: `grammar_quiz_${topic}_${Date.now()}`, checkDailyBonus: true });
        // Save quiz session
        await supabase.from("grammar_sessions").insert({
          user_id: userId,
          session_type: "quiz",
          topic,
          questions: questions.map((q) => ({ question: q.question, options: q.options })),
          user_answers: [...answers, selected].map((a, i) => a !== null && a !== undefined ? questions[i]?.options[a] || String(a) : ""),
          correct_answers: questions.map((q) => q.options[q.correct]),
          score: finalScore,
          total: questions.length,
        } as any);
        setLogged(true);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const q = questions[current];
  const progress = questions.length ? ((current + (finished ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {questions.length === 0 && !loading && (
        <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Mini kviz</CardTitle>
            <CardDescription>Izaberi temu i testiraj svoje znanje sa 5 pitanja.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="npr. prezent, članovi, red reči..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={100}
            />
            <Button variant="hero" className="w-full" onClick={generate} disabled={!topic.trim()}>
              Pokreni kviz
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
            <p className="text-muted-foreground text-sm">Generišem pitanja...</p>
          </CardContent>
        </Card>
      )}

      {questions.length > 0 && !finished && q && (
        <>
          <Progress value={progress} className="h-2" />
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider text-accent font-medium">
                  Pitanje {current + 1}/{questions.length}
                </CardDescription>
                <CardTitle className="text-xl">{q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = idx === q.correct;
                  let cls = "border-border bg-background hover:border-accent";
                  if (selected !== null) {
                    if (isCorrect) cls = "border-accent bg-accent/10";
                    else if (isSelected) cls = "border-destructive bg-destructive/10";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${cls}`}
                    >
                      {selected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      <span className="text-sm text-foreground">{opt}</span>
                    </button>
                  );
                })}

                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">{q.explanation}</p>
                  </motion.div>
                )}

                {selected !== null && (
                  <Button variant="hero" className="w-full mt-4" onClick={handleNext}>
                    {current + 1 < questions.length ? "Sledeće" : "Završi"} <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {finished && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30 text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {score}/{questions.length} tačnih!
              </h2>
              <p className="text-muted-foreground">
                {score === questions.length
                  ? "Savršeno! 🎉"
                  : score / questions.length >= 0.8
                    ? "Odlično! +5 bonus poena! 💪"
                    : score / questions.length >= 0.6
                      ? "Dobro urađeno! 👍"
                      : "Pokušaj ponovo! 📚"}
              </p>
              {logged && (
                <p className="text-xs text-accent font-medium">
                  ✅ +{15 + (score / questions.length >= 0.8 ? 5 : 0)} poena zabeleženo
                </p>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button variant="hero-outline" onClick={() => { setQuestions([]); setTopic(""); }}>
                  Novi kviz
                </Button>
                <Button variant="hero" onClick={() => window.location.href = "/practice"}>
                  Nazad
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
