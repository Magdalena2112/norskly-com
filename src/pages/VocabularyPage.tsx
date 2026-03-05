import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Loader2, BookOpen, PenTool, Brain, Layers,
  CheckCircle2, XCircle, Save, ThumbsUp, ThumbsDown, RotateCcw, Volume2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/logActivity";
import { logErrors } from "@/lib/logErrors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ───
interface VocabWord {
  word: string;
  translation: string;
  synonym: string | null;
  antonym: string | null;
  examples: string[];
}

interface SavedWord {
  id: string;
  word: string;
  synonym: string | null;
  antonym: string | null;
  examples: string[];
  theme: string;
  user_sentence: string | null;
  status: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ─── TTS helper ───
function speakNorwegian(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "nb-NO";
  utter.rate = 0.9;
  // Try to find a Norwegian voice
  const voices = window.speechSynthesis.getVoices();
  const nbVoice = voices.find((v) => v.lang.startsWith("nb") || v.lang.startsWith("no"));
  if (nbVoice) utter.voice = nbVoice;
  window.speechSynthesis.speak(utter);
}

// ─── AI call helper ───
async function callVocabAI(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("vocabulary-ai", {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message || "AI request failed");
  return res.data;
}

export default function VocabularyPage() {
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
          <span className="font-display font-bold text-lg text-foreground">Vokabular</span>
          <span className="ml-auto text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
            Nivo {level}
          </span>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-6">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generate" className="gap-1 text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 hidden sm:block" /> Generiši
            </TabsTrigger>
            <TabsTrigger value="sentence" className="gap-1 text-xs sm:text-sm">
              <PenTool className="w-4 h-4 hidden sm:block" /> Rečenica
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-1 text-xs sm:text-sm">
              <Layers className="w-4 h-4 hidden sm:block" /> Kartice
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1 text-xs sm:text-sm">
              <Brain className="w-4 h-4 hidden sm:block" /> Kviz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <GenerateTab level={level} userId={user?.id} />
          </TabsContent>
          <TabsContent value="sentence">
            <SentenceTab level={level} userId={user?.id} />
          </TabsContent>
          <TabsContent value="flashcards">
            <FlashcardsTab userId={user?.id} />
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
// TAB 1: Generate vocabulary by theme
// ═══════════════════════════════════════
function GenerateTab({ level, userId }: { level: string; userId?: string }) {
  const [theme, setTheme] = useState("");
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async (loadMore = false) => {
    if (!theme.trim()) return;
    setLoading(true);
    if (!loadMore) { setWords([]); setSaved(false); }
    try {
      const exclude_words = loadMore ? words.map((w) => w.word) : [];
      const data = await callVocabAI({ action: "generate_vocab", level, theme: theme.trim(), exclude_words });
      const newWords = data.words || [];
      setWords((prev) => loadMore ? [...prev, ...newWords] : newWords);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveWords = async () => {
    if (!userId || words.length === 0) return;
    setSaving(true);
    try {
      const rows = words.map((w) => ({
        user_id: userId,
        word: w.word,
        synonym: w.synonym || null,
        antonym: w.antonym || null,
        examples: w.examples as any,
        theme: theme.trim(),
        status: "new",
      }));
      const { error } = await supabase.from("vocab_items").insert(rows);
      if (error) throw error;
      // No XP for content generation (word saving)
      setSaved(true);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic">
        <CardHeader>
          <CardTitle className="text-lg">Generiši vokabular po temi</CardTitle>
          <CardDescription>Unesite temu i dobijte nove reči sa primerima.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="npr. posao, putovanje, hrana, porodica..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            maxLength={100}
          />
          <Button variant="hero" className="w-full" onClick={() => generate(false)} disabled={loading || !theme.trim()}>
            {loading && words.length === 0 ? <><Loader2 className="w-4 h-4 animate-spin" /> Generišem...</> : "Generiši reči"}
          </Button>
        </CardContent>
      </Card>

      {words.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {words.map((w, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-display font-bold text-foreground">{w.word} <span className="text-base font-normal text-muted-foreground">— {w.translation}</span></p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => speakNorwegian(w.word)} title="Izgovor">
                    <Volume2 className="w-4 h-4 text-accent" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {w.synonym && (
                    <span className="bg-accent/10 text-accent px-2 py-1 rounded-full">
                      Sinonim: {w.synonym}
                    </span>
                  )}
                  {w.antonym && (
                    <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                      Antonim: {w.antonym}
                    </span>
                  )}
                </div>
                {w.examples?.map((ex, j) => (
                  <p key={j} className="text-sm text-muted-foreground italic">"{ex}"</p>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            {!saved ? (
              <Button variant="hero" className="flex-1 gap-2" onClick={saveWords} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sačuvaj reči (+8 poena)
              </Button>
            ) : (
              <Button variant="ghost" className="flex-1 text-accent" disabled>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Sačuvano! ✓
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => generate(true)}
            disabled={loading}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Učitavam...</> : "Generiši još reči"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 2: Use word in sentence
// ═══════════════════════════════════════
function SentenceTab({ level, userId }: { level: string; userId?: string }) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [selectedWord, setSelectedWord] = useState("");
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<{
    corrected_sentence: string;
    is_correct: boolean;
    explanation: string;
    tips: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingWords, setLoadingWords] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoadingWords(true);
      const { data } = await supabase
        .from("vocab_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setSavedWords((data as SavedWord[]) || []);
      setLoadingWords(false);
    })();
  }, [userId]);

  const submitSentence = async () => {
    if (!selectedWord || !sentence.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await callVocabAI({
        action: "correct_sentence",
        level,
        word: selectedWord,
        sentence: sentence.trim(),
      });
      setResult(data);

      // Log errors from sentence correction
      if (userId && data._errors?.length) {
        await logErrors(userId, "vocabulary", "exercise_check", data._errors.slice(0, 2), selectedWord);
      }

      // Award XP for sentence writing: +6, +2 bonus if correct
      if (userId) {
        const bonus = data.is_correct ? 2 : 0;
        await logActivity(userId, "vocabulary", "sentence_written", 6 + bonus, {
          word: selectedWord,
          is_correct: data.is_correct,
        }, { checkDailyBonus: true });
      }

      // Save user_sentence to vocab_items
      if (userId) {
        const item = savedWords.find((w) => w.word === selectedWord);
        if (item) {
          await supabase
            .from("vocab_items")
            .update({ user_sentence: sentence.trim(), status: "practiced" })
            .eq("id", item.id);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loadingWords) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (savedWords.length === 0) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center space-y-2">
          <p className="text-muted-foreground">Nemate sačuvanih reči.</p>
          <p className="text-sm text-muted-foreground">Prvo generišite i sačuvajte reči u "Generiši" tabu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic">
        <CardHeader>
          <CardTitle className="text-lg">Koristi reč u rečenici</CardTitle>
          <CardDescription>Izaberite reč i napišite rečenicu. AI će je ispraviti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedWord} onValueChange={setSelectedWord}>
            <SelectTrigger>
              <SelectValue placeholder="Izaberi reč..." />
            </SelectTrigger>
            <SelectContent>
              {savedWords.map((w) => (
                <SelectItem key={w.id} value={w.word}>
                  {w.word} ({w.theme})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Napišite rečenicu koristeći izabranu reč..."
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
          />

          <Button
            variant="hero"
            className="w-full"
            onClick={submitSentence}
            disabled={loading || !selectedWord || !sentence.trim()}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Proveravam...</> : "Proveri rečenicu"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Card className={result.is_correct ? "border-accent/30 bg-accent/5" : "border-destructive/30 bg-destructive/5"}>
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center gap-2">
                {result.is_correct ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="font-medium text-foreground">
                  {result.is_correct ? "Tačno!" : "Ima grešaka"}
                </span>
              </div>
              <p className="text-foreground bg-background/50 p-3 rounded-lg">{result.corrected_sentence}</p>
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
              {result.tips && (
                <p className="text-xs text-accent italic">💡 {result.tips}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 3: Flashcards from saved words
// ═══════════════════════════════════════
function FlashcardsTab({ userId }: { userId?: string }) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [unknown, setUnknown] = useState<number[]>([]);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoadingWords(true);
      const { data } = await supabase
        .from("vocab_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setSavedWords((data as SavedWord[]) || []);
      setLoadingWords(false);
    })();
  }, [userId]);

  const reviewed = known.length + unknown.length;
  const isDone = savedWords.length > 0 && reviewed >= Math.min(10, savedWords.length);
  const card = savedWords[index];

  const handleAction = async (isKnown: boolean) => {
    if (isKnown) setKnown((p) => [...p, index]);
    else setUnknown((p) => [...p, index]);
    setFlipped(false);

    // Update status in DB
    if (userId && card) {
      await supabase
        .from("vocab_items")
        .update({ status: isKnown ? "known" : "learning" })
        .eq("id", card.id);
    }

    const nextReviewed = reviewed + 1;
    if (nextReviewed >= Math.min(10, savedWords.length)) {
      // Will show done screen
      if (userId && !logged) {
        await logActivity(userId, "vocabulary", "flashcards_completed", 8, {
          known: known.length + (isKnown ? 1 : 0),
          unknown: unknown.length + (isKnown ? 0 : 1),
        }, { dedupKey: `flashcards_${Date.now()}`, checkDailyBonus: true });
        setLogged(true);
      }
      return;
    }

    // Find next unreviewed card
    for (let i = 1; i <= savedWords.length; i++) {
      const next = (index + i) % savedWords.length;
      if (!known.includes(next) && !unknown.includes(next) && next !== index) {
        setIndex(next);
        return;
      }
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
    setLogged(false);
  };

  if (loadingWords) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (savedWords.length === 0) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center space-y-2">
          <p className="text-muted-foreground">Nemate sačuvanih reči za kartice.</p>
          <p className="text-sm text-muted-foreground">Prvo generišite i sačuvajte reči u "Generiši" tabu.</p>
        </CardContent>
      </Card>
    );
  }

  if (isDone) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="shadow-nordic text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <p className="text-5xl mb-2">🎯</p>
            <h2 className="text-2xl font-display font-bold text-foreground">Sesija završena!</h2>
            <div className="flex gap-6 justify-center text-sm">
              <span className="text-accent font-medium">✅ Znam: {known.length}</span>
              <span className="text-destructive font-medium">❌ Ne znam: {unknown.length}</span>
            </div>
            {logged && <p className="text-xs text-accent font-medium">+8 poena zabeleženo</p>}
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={handleRestart} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Ponovi
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <Progress value={(reviewed / Math.min(10, savedWords.length)) * 100} className="h-2" />
      <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">{card?.theme}</p>

      <div className="cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="shadow-nordic min-h-[240px] flex items-center justify-center">
              <CardContent className="pt-6 text-center space-y-3">
                {!flipped ? (
                  <>
                    <p className="text-4xl font-display font-bold text-foreground">{card?.word}</p>
                    <p className="text-sm text-muted-foreground">Tapni da vidiš detalje</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-display font-bold text-accent">{card?.word}</p>
                    {card?.synonym && <p className="text-sm text-muted-foreground">Sinonim: {card.synonym}</p>}
                    {card?.antonym && <p className="text-sm text-muted-foreground">Antonim: {card.antonym}</p>}
                    {card?.examples?.map((ex: string, j: number) => (
                      <p key={j} className="text-sm text-muted-foreground italic">"{ex}"</p>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={() => handleAction(false)} className="gap-2">
            <ThumbsDown className="w-4 h-4" /> Ne znam
          </Button>
          <Button variant="hero" size="lg" onClick={() => handleAction(true)} className="gap-2">
            <ThumbsUp className="w-4 h-4" /> Znam
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// TAB 4: Quiz from saved words
// ═══════════════════════════════════════
function QuizTab({ level, userId }: { level: string; userId?: string }) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoadingWords(true);
      const { data } = await supabase
        .from("vocab_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setSavedWords((data as SavedWord[]) || []);
      setLoadingWords(false);
    })();
  }, [userId]);

  const generateQuiz = async () => {
    if (savedWords.length < 3) return;
    setLoading(true);
    setQuestions([]);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setLogged(false);
    try {
      const wordList = savedWords.map((w) => w.word).join(", ");
      const data = await callVocabAI({ action: "generate_quiz", level, theme: wordList });
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
    if (idx === questions[current].correct) {
      setScore((s) => s + 1);
    } else if (userId) {
      const q = questions[current];
      const errorData = (q as any)._error;
      if (errorData) {
        await logErrors(userId, "vocabulary", "quiz", [{
          category: errorData.category || "meaning_confusion",
          topic: errorData.topic || "vocabulary quiz",
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
      if (userId && !logged) {
        const finalScore = score + (selected === questions[current].correct ? 1 : 0);
        const pct = (finalScore / questions.length) * 100;
        const bonus = pct >= 80 ? 5 : 0;
        await logActivity(userId, "vocabulary", "quiz_completed", 15 + bonus, {
          score: finalScore,
          total: questions.length,
          percentage: pct,
        }, { dedupKey: `vocab_quiz_${Date.now()}`, checkDailyBonus: true });
        setLogged(true);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const q = questions[current];
  const progress = questions.length ? ((current + (finished ? 1 : 0)) / questions.length) * 100 : 0;

  if (loadingWords) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (savedWords.length < 3) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center space-y-2">
          <p className="text-muted-foreground">Potrebno je najmanje 3 sačuvane reči za kviz.</p>
          <p className="text-sm text-muted-foreground">Imate {savedWords.length} reči. Generišite još u "Generiši" tabu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 && !loading && (
        <Card className="shadow-nordic">
          <CardHeader>
            <CardTitle className="text-lg">Kviz iz sačuvanih reči</CardTitle>
            <CardDescription>10 pitanja iz vaših sačuvanih reči ({savedWords.length} reči).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="hero" className="w-full" onClick={generateQuiz}>
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
                    {current + 1 >= questions.length ? "Završi kviz" : "Sledeće pitanje →"}
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
              <p className="text-5xl mb-2">{score / questions.length >= 0.8 ? "🏆" : "📝"}</p>
              <h2 className="text-2xl font-display font-bold text-foreground">Kviz završen!</h2>
              <p className="text-lg text-foreground">
                Rezultat: <span className="text-accent font-bold">{score}/{questions.length}</span>{" "}
                ({Math.round((score / questions.length) * 100)}%)
              </p>
              {score / questions.length >= 0.8 && (
                <p className="text-sm text-accent font-medium">🎉 Bonus +5 poena za odličan rezultat!</p>
              )}
              {logged && (
                <p className="text-xs text-accent">
                  +{15 + (score / questions.length >= 0.8 ? 5 : 0)} poena zabeleženo
                </p>
              )}
              <Button variant="hero" className="mt-4" onClick={() => { setQuestions([]); setFinished(false); }}>
                Novi kviz
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
