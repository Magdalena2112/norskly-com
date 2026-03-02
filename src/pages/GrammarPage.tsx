import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Loader2, BookOpen, PenTool, Brain, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/logActivity";

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
  const level = profile.level || "A1";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Gramatika</span>
          <span className="ml-auto text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
            Nivo {level}
          </span>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-6">
        <Tabs defaultValue="exercises" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercises" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4" /> Vežbe
            </TabsTrigger>
            <TabsTrigger value="correction" className="gap-1.5 text-xs sm:text-sm">
              <PenTool className="w-4 h-4" /> Korekcija
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm">
              <Brain className="w-4 h-4" /> Kviz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises">
            <ExercisesTab level={level} userId={user?.id} />
          </TabsContent>
          <TabsContent value="correction">
            <CorrectionTab level={level} userId={user?.id} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab level={level} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 1: Generate Exercises
// ═══════════════════════════════════════
function ExercisesTab({ level, userId }: { level: string; userId?: string }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showSolutions, setShowSolutions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setExercises([]);
    setShowSolutions(false);
    setCompleted(false);
    try {
      const data = await callGrammarAI({ action: "generate_exercises", level, topic: topic.trim(), count });
      setExercises(data.exercises || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async () => {
    if (userId) {
      await logActivity(userId, "grammar", "exercises_completed", 10, { topic, count: exercises.length });
    }
    setCompleted(true);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic">
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
              max={10}
              value={count}
              onChange={(e) => setCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
          <Button variant="hero" className="w-full" onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generišem...</> : "Generiši vežbe"}
          </Button>
        </CardContent>
      </Card>

      {exercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {exercises.map((ex, i) => (
            <Card key={ex.id || i}>
              <CardContent className="pt-5 pb-5 space-y-2">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Zadatak {i + 1}</p>
                <p className="text-sm text-muted-foreground">{ex.instruction}</p>
                <p className="text-foreground font-medium">{ex.sentence}</p>
                {ex.hint && <p className="text-xs text-muted-foreground italic">💡 {ex.hint}</p>}
                {showSolutions && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 p-3 rounded-lg bg-accent/10">
                    <p className="text-sm font-medium text-accent">✅ {ex.solution}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowSolutions(!showSolutions)}
            >
              {showSolutions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSolutions ? "Sakrij rešenja" : "Prikaži rešenja"}
            </Button>
            {!completed ? (
              <Button variant="hero" className="flex-1 gap-2" onClick={markCompleted}>
                <CheckCircle2 className="w-4 h-4" /> Završeno (+10 poena)
              </Button>
            ) : (
              <Button variant="ghost" className="flex-1 text-accent" disabled>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Zabeleženo! ✓
              </Button>
            )}
          </div>
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
        await logActivity(userId, "grammar", "text_corrected", 12, {
          mistakes_count: data.mistakes?.length || 0,
        });
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
      <Card className="shadow-nordic">
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

          {logged && (
            <p className="text-center text-xs text-accent font-medium">✅ +12 poena zabeleženo</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 3: Mini Quiz
// ═══════════════════════════════════════
function QuizTab({ level, userId }: { level: string; userId?: string }) {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
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

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[current].correct) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      // Log activity
      if (userId && !logged) {
        const finalScore = selected === questions[current].correct ? score + 1 : score;
        // Adjusted since score state hasn't updated yet for last question
        const pct = (finalScore / questions.length) * 100;
        const bonus = pct >= 80 ? 5 : 0;
        await logActivity(userId, "grammar", "quiz_completed", 15 + bonus, {
          topic,
          score: finalScore,
          total: questions.length,
          percentage: pct,
        });
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
        <Card className="shadow-nordic">
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
        <Card className="shadow-nordic">
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
            <Card className="shadow-nordic">
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
          <Card className="shadow-nordic text-center">
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
