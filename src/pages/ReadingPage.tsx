import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpenText, Loader2, CheckCircle2, XCircle, Sparkles, History, Library, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/logActivity";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";

const TOPICS = [
  { id: "svakodnevni-zivot", label: "Svakodnevni život" },
  { id: "posao", label: "Posao" },
  { id: "putovanja", label: "Putovanja" },
  { id: "kultura", label: "Kultura" },
  { id: "skola", label: "Škola" },
  { id: "zdravlje", label: "Zdravlje" },
  { id: "tehnologija", label: "Tehnologija" },
];

const LENGTHS = [
  { id: "kratak", label: "Kratak tekst", hint: "~100 reči" },
  { id: "srednji", label: "Srednji tekst", hint: "~220 reči" },
  { id: "duzi", label: "Duži tekst", hint: "~400 reči" },
];

type Exercise = {
  id: number;
  type: "true_false" | "open" | "synonym" | "antonym" | "vocab";
  question: string;
  answer: string | boolean;
  explanation?: string;
  word?: string;
};

type VocabItem = { word: string; translation: string; explanation: string };

type GeneratedReading = {
  title: string;
  text: string;
  vocabulary: VocabItem[];
  exercises: Exercise[];
};

type EvalResult = {
  results: Array<{
    id: number;
    is_correct: boolean;
    user_answer: string;
    correct_answer: string;
    explanation: string;
    feedback: string;
  }>;
  score: number;
  total: number;
  overall_feedback: string;
  vocabulary_feedback: string;
};

export default function ReadingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [tab, setTab] = useState("generate");
  const [topic, setTopic] = useState(TOPICS[0].label);
  const [length, setLength] = useState("kratak");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<GeneratedReading | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | boolean>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  const level = profile.level || "A1";

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reading_sessions" as any)
      .select("id, title, topic, length, level, score, total, created_at, completed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setHistory(data || []));
  }, [user, result]);

  const generateReading = async () => {
    if (!user) return;
    setLoading(true);
    setReading(null);
    setResult(null);
    setAnswers({});
    setSessionId(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("reading-ai", {
        body: { action: "generate", level, topic, length },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data as GeneratedReading;
      setReading(data);

      const { data: inserted } = await supabase
        .from("reading_sessions" as any)
        .insert({
          user_id: user.id,
          level,
          topic,
          length,
          title: data.title,
          text: data.text,
          vocabulary: data.vocabulary as any,
          exercises: data.exercises as any,
        })
        .select("id")
        .single();
      if (inserted) setSessionId((inserted as any).id);
    } catch (e: any) {
      toast.error(e.message || "Greška pri generisanju teksta");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    if (!user || !reading) return;
    setEvaluating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("reading-ai", {
        body: { action: "evaluate", level, exercises: reading.exercises, answers },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const evalData = res.data as EvalResult;
      setResult(evalData);

      const points = Math.max(5, evalData.score * 5);
      const xp = await logActivity(user.id, "reading" as any, "reading_completed", points, {
        topic, length, level, score: evalData.score, total: evalData.total,
      }, { dedupKey: sessionId ? `reading_${sessionId}` : undefined, checkDailyBonus: true });
      setXpEarned(xp?.points_awarded || points);

      if (sessionId) {
        await supabase.from("reading_sessions" as any).update({
          user_answers: answers as any,
          feedback: evalData as any,
          score: evalData.score,
          total: evalData.total,
          completed: true,
        }).eq("id", sessionId);
      }
    } catch (e: any) {
      toast.error(e.message || "Greška pri proveri");
    } finally {
      setEvaluating(false);
    }
  };

  const loadHistorySession = async (id: string) => {
    const { data } = await supabase
      .from("reading_sessions" as any)
      .select("*").eq("id", id).maybeSingle();
    if (!data) return;
    const d = data as any;
    setReading({ title: d.title, text: d.text, vocabulary: d.vocabulary || [], exercises: d.exercises || [] });
    setAnswers(d.user_answers || {});
    setResult(d.completed ? d.feedback : null);
    setSessionId(d.id);
    setTopic(d.topic);
    setLength(d.length);
    setTab("generate");
  };

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-6 sm:py-10 relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <BackButton to="/practice" className="text-primary" />
          <div className="flex-1">
            <p className="font-script italic text-primary/60 text-sm">Lesing</p>
            <h1 className="text-display text-2xl sm:text-3xl text-primary leading-tight flex items-center gap-2">
              <BookOpenText className="w-6 h-6" /> Čitanje
            </h1>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">Nivo: {level}</Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-cream/80 border border-border/50 mb-5 overflow-x-auto flex w-full justify-start">
            <TabsTrigger value="generate" className="gap-1.5"><Wand2 className="w-4 h-4" />Generiši tekst</TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5"><Library className="w-4 h-4" />Biblioteka</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="w-4 h-4" />Istorija</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-5">
            {!reading && (
              <Card className="bg-cream/90 border-border/60 shadow-postcard rounded-3xl">
                <CardContent className="pt-6 space-y-5">
                  <div>
                    <p className="font-script italic text-xs text-primary/60 mb-1">Tema</p>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TOPICS.map(t => <SelectItem key={t.id} value={t.label}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="font-script italic text-xs text-primary/60 mb-1">Dužina teksta</p>
                    <div className="grid grid-cols-3 gap-2">
                      {LENGTHS.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setLength(l.id)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${length === l.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border/60 bg-background hover:border-primary/40"}`}
                        >
                          <div className="font-display text-sm text-primary">{l.label}</div>
                          <div className="text-[11px] text-muted-foreground">{l.hint}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/40 p-3 text-xs text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1 text-primary/60" />
                    Težina teksta se automatski prilagođava tvom nivou ({level}).
                  </div>
                  <Button onClick={generateReading} disabled={loading} variant="hero" className="w-full">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generišem…</> : "Generiši tekst"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {reading && (
              <>
                <Card className="bg-cream/90 border-border/60 shadow-postcard rounded-3xl">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div>
                        <p className="font-script italic text-xs text-primary/60">{topic} · {LENGTHS.find(l=>l.id===length)?.label}</p>
                        <h2 className="text-display text-xl text-primary">{reading.title}</h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setReading(null); setResult(null); setAnswers({}); }}>Novo</Button>
                    </div>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
                      {reading.text}
                    </div>
                  </CardContent>
                </Card>

                {reading.vocabulary?.length > 0 && (
                  <Card className="bg-cream/85 border-border/50 rounded-3xl">
                    <CardContent className="pt-5">
                      <h3 className="font-display font-semibold text-primary mb-3">Ključne reči</h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {reading.vocabulary.map((v, i) => (
                          <div key={i} className="rounded-xl border border-border/50 bg-background/60 p-3">
                            <div className="text-sm"><span className="font-semibold text-primary">{v.word}</span> — <span className="text-muted-foreground">{v.translation}</span></div>
                            {v.explanation && <div className="text-xs text-muted-foreground mt-0.5">{v.explanation}</div>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(() => {
                  const isAdvanced = level === "B1" || level === "B2" || level === "C1";
                  const L = isAdvanced
                    ? {
                        tf: { title: "1. Sant eller usant", instr: "Les påstandene og velg om de er sanne eller usanne." },
                        open: { title: "2. Leseforståelse", instr: "Svar på spørsmålene basert på teksten." },
                        vocab: { title: "3. Ordforråd", instr: "Finn synonymer, antonymer og forklar betydningen av ordene." },
                        yes: "Sant", no: "Usant", placeholder: "Ditt svar…", submit: "Send svar", checking: "Sjekker…",
                      }
                    : {
                        tf: { title: "1. Tačno ili netačno", instr: "Pročitaj tvrdnje i označi da li su tačne ili netačne." },
                        open: { title: "2. Razumevanje teksta", instr: "Odgovori na pitanja na osnovu teksta." },
                        vocab: { title: "3. Vokabular", instr: "Pronađi sinonime, antonime i objasni značenje izraza." },
                        yes: "Tačno", no: "Netačno", placeholder: "Tvoj odgovor…", submit: "Pošalji odgovore", checking: "Proveravam…",
                      };

                  const groups: Array<{ key: string; title: string; instr: string; items: Exercise[] }> = [
                    { key: "tf", title: L.tf.title, instr: L.tf.instr, items: reading.exercises.filter(e => e.type === "true_false") },
                    { key: "open", title: L.open.title, instr: L.open.instr, items: reading.exercises.filter(e => e.type === "open") },
                    { key: "vocab", title: L.vocab.title, instr: L.vocab.instr, items: reading.exercises.filter(e => ["synonym", "antonym", "vocab"].includes(e.type)) },
                  ];

                  let globalIdx = 0;
                  return (
                    <>
                      {groups.map(g => g.items.length > 0 && (
                        <Card key={g.key} className="bg-cream/90 border-border/60 shadow-postcard rounded-3xl">
                          <CardContent className="pt-5 space-y-3">
                            <div>
                              <h3 className="font-display font-semibold text-primary">{g.title}</h3>
                              <p className="text-xs text-muted-foreground italic mt-0.5">{g.instr}</p>
                            </div>
                            {g.items.map((ex) => {
                              globalIdx += 1;
                              const r = result?.results?.find(x => x.id === ex.id);
                              return (
                                <div key={ex.id} className="rounded-2xl border border-border/50 bg-background/60 p-4">
                                  <p className="text-sm text-foreground mb-2">{globalIdx}. {ex.question}</p>
                                  {ex.type === "true_false" ? (
                                    <div className="flex gap-2">
                                      {[true, false].map(v => (
                                        <Button key={String(v)} size="sm"
                                          variant={answers[ex.id] === v ? "default" : "outline"}
                                          onClick={() => setAnswers(a => ({ ...a, [ex.id]: v }))}
                                          disabled={!!result}>
                                          {v ? L.yes : L.no}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <Textarea
                                      value={(answers[ex.id] as string) || ""}
                                      onChange={(e) => setAnswers(a => ({ ...a, [ex.id]: e.target.value }))}
                                      placeholder={L.placeholder}
                                      rows={2}
                                      disabled={!!result}
                                    />
                                  )}
                                  {r && (
                                    <div className={`mt-3 rounded-xl p-3 text-sm ${r.is_correct ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                                      <div className="flex items-center gap-1.5 font-medium">
                                        {r.is_correct ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                                        {r.is_correct ? (isAdvanced ? "Riktig" : "Tačno") : (isAdvanced ? "Feil" : "Netačno")}
                                      </div>
                                      {!r.is_correct && <div className="text-xs mt-1"><b>{isAdvanced ? "Riktig svar:" : "Tačan odgovor:"}</b> {r.correct_answer}</div>}
                                      {r.explanation && <div className="text-xs mt-1 text-muted-foreground">{r.explanation}</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ))}

                      <Card className="bg-cream/90 border-border/60 shadow-postcard rounded-3xl">
                        <CardContent className="pt-5 space-y-4">
                          {!result ? (
                            <Button onClick={submitAnswers} disabled={evaluating} variant="hero" className="w-full">
                              {evaluating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{L.checking}</> : L.submit}
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}

                <Card className="hidden">
                  <CardContent className="pt-5 space-y-4">
                    {reading.exercises.map((ex, idx) => null)}

                    {!result ? (
                      <Button onClick={submitAnswers} disabled={evaluating} variant="hero" className="w-full">
                        {evaluating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Proveravam…</> : "Pošalji odgovore"}
                      </Button>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-display text-lg text-primary">Rezultat: {result.score} / {result.total}</div>
                          <Badge className="bg-sunset text-cream">+{xpEarned} XP</Badge>
                        </div>
                        {result.overall_feedback && <p className="text-sm text-foreground">{result.overall_feedback}</p>}
                        {result.vocabulary_feedback && <p className="text-xs text-muted-foreground italic">{result.vocabulary_feedback}</p>}
                        <Button variant="outline" size="sm" onClick={() => { setReading(null); setResult(null); setAnswers({}); }}>
                          Novi tekst
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="library">
            <Card className="bg-cream/85 border-border/50 rounded-3xl">
              <CardContent className="pt-8 pb-8 text-center">
                <Library className="w-10 h-10 mx-auto text-primary/40 mb-3" />
                <h3 className="font-display text-lg text-primary mb-1">Biblioteka tekstova</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Uskoro: kategorizovani tekstovi po nivou i temi, kao i tekstovi koje dodaju profesori.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-2">
              {history.length === 0 && (
                <Card className="bg-cream/85 border-border/50 rounded-3xl">
                  <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
                    Još nema završenih tekstova.
                  </CardContent>
                </Card>
              )}
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadHistorySession(h.id)}
                  className="w-full text-left rounded-2xl border border-border/50 bg-cream/80 hover:bg-cream p-4 transition shadow-card-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-primary truncate">{h.title || h.topic}</div>
                      <div className="text-xs text-muted-foreground">{h.topic} · {h.length} · {h.level} · {new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    {h.completed && <Badge variant="secondary">{h.score}/{h.total}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
