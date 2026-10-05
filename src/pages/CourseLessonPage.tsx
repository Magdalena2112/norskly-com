import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Volume2, Play, Square, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Check, X,
  BookOpen, Languages, MessageSquare, PenLine, BookOpenText, Headphones, Mic, Send, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { lessonImage, speakUrl, type CourseLesson } from "@/lib/courseLessons";

type ModuleKey = "citanje" | "slusanje" | "vokabular" | "gramatika" | "izgovor" | "razgovor" | "pisanje";
const MODULES: { key: ModuleKey; title: string; sub: string; desc: string; icon: typeof BookOpen; tone: string }[] = [
  { key: "citanje", title: "Čitanje", sub: "Lesing & forståelse", desc: "Pročitaj tekst lekcije i proveri razumevanje.", icon: BookOpenText, tone: "bg-secondary/70" },
  { key: "slusanje", title: "Slušanje", sub: "Lytting", desc: "Prepoznaj rečenice iz lekcije po zvuku.", icon: Headphones, tone: "bg-accent/40" },
  { key: "vokabular", title: "Vokabular", sub: "Ord & uttrykk", desc: "Kartice i kviz sa rečima iz lekcije.", icon: Languages, tone: "bg-accent/40" },
  { key: "gramatika", title: "Gramatika", sub: "Grammatikk", desc: "Pravila iz lekcije i vežba dopunjavanja.", icon: BookOpen, tone: "bg-secondary/70" },
  { key: "izgovor", title: "Izgovor", sub: "Uttale", desc: "Slušaj i ponavljaj rečenice iz teksta.", icon: Mic, tone: "bg-secondary/70" },
  { key: "razgovor", title: "Razgovor", sub: "Snakk", desc: "Razgovaraj o temi lekcije sa AI sagovornikom.", icon: MessageSquare, tone: "bg-accent/40" },
  { key: "pisanje", title: "Pisanje", sub: "Skriving", desc: "Napiši kratak tekst na temu lekcije i dobij ispravke.", icon: PenLine, tone: "bg-accent/40" },
];

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lesson-ai`;
async function lessonAi(body: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const r = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "AI greška");
  return j;
}

const clean = (w: string) => w.replace(/[^\p{L}]/gu, "");
function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }
interface Q { prompt: string; hint?: string; options: string[]; answer: string; audio?: string }

function vocabQuestions(l: CourseLesson, n = 8): Q[] {
  const all = l.vocabulary;
  return shuffle(all).slice(0, n).map((w) => ({
    prompt: w.word, hint: "Šta znači ova reč?", answer: w.translation,
    options: shuffle([w.translation, ...shuffle(all.filter((x) => x.word !== w.word)).slice(0, 3).map((x) => x.translation)]),
  }));
}
function clozeQuestions(sentences: string[], pool: string[], n: number): Q[] {
  const qs: Q[] = [];
  for (const s of shuffle(sentences)) {
    const words = s.split(/\s+/).filter((w) => clean(w).length > 2);
    if (!words.length) continue;
    const target = clean(words[Math.floor(Math.random() * words.length)]);
    const distract = shuffle(Array.from(new Set(pool.filter((p) => p.toLowerCase() !== target.toLowerCase())))).slice(0, 3);
    if (distract.length < 2) continue;
    qs.push({ prompt: s.replace(target, "_____"), hint: "Dopuni rečenicu.", answer: target, options: shuffle([target, ...distract]) });
    if (qs.length >= n) break;
  }
  return qs;
}

function Quiz({ questions, onDone, onPlay }: { questions: Q[]; onDone: (score: number) => void; onPlay?: (t: string) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  if (!questions.length) return <Button variant="hero" onClick={() => onDone(0)}>Nastavi</Button>;
  const q = questions[i];
  const next = () => { if (i + 1 >= questions.length) onDone(score); else { setI(i + 1); setPicked(null); } };
  return (
    <div>
      <p className="text-xs text-primary/60 mb-2">{i + 1} / {questions.length}</p>
      {q.hint && <p className="text-sm text-muted-foreground">{q.hint}</p>}
      {q.audio ? (
        <Button variant="outline" className="my-4" onClick={() => onPlay?.(q.audio!)}><Volume2 className="w-4 h-4" /> Pusti rečenicu</Button>
      ) : <p className="font-display text-2xl text-primary my-3">{q.prompt}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((o) => {
          const state = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
          return (
            <button key={o} disabled={!!picked} onClick={() => { setPicked(o); if (o === q.answer) setScore((s) => s + 1); }}
              className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${state === "ok" ? "border-forest bg-forest/10 text-forest" : state === "bad" ? "border-destructive bg-destructive/10 text-destructive" : "border-border/60 bg-background/60 text-primary hover:bg-secondary/50"}`}>
              <span className="flex items-center gap-2">{state === "ok" && <Check className="w-4 h-4" />}{state === "bad" && <X className="w-4 h-4" />}{o}</span>
            </button>
          );
        })}
      </div>
      {picked && <div className="mt-4 flex justify-end"><Button variant="hero" size="sm" onClick={next}>Dalje <ArrowRight className="w-4 h-4" /></Button></div>}
    </div>
  );
}

function Flashcards({ lesson, onDone }: { lesson: CourseLesson; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const w = lesson.vocabulary[i];
  if (!w) return null;
  return (
    <div className="text-center">
      <button onClick={() => setFlip((f) => !f)} className="w-full rounded-2xl border border-border/60 bg-background/70 py-12 px-4">
        <p className="font-display text-3xl text-primary">{flip ? w.translation : w.word}</p>
        <p className="text-xs text-muted-foreground mt-2">Klikni da okreneš karticu</p>
      </button>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" disabled={i === 0} onClick={() => { setI(i - 1); setFlip(false); }}><ArrowLeft className="w-4 h-4" /></Button>
        <span className="text-xs text-primary/60">{i + 1} / {lesson.vocabulary.length}</span>
        {i < lesson.vocabulary.length - 1
          ? <Button variant="ghost" size="sm" onClick={() => { setI(i + 1); setFlip(false); }}><ArrowRight className="w-4 h-4" /></Button>
          : <Button variant="hero" size="sm" onClick={onDone}>Na kviz</Button>}
      </div>
    </div>
  );
}

function Chat({ lesson, onDone }: { lesson: CourseLesson; onDone: () => void }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string; translation?: string; correction?: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (list: typeof msgs) => {
    setBusy(true);
    try {
      const r = await lessonAi({ action: "chat", lessonId: lesson.id, messages: list.map(({ role, content }) => ({ role, content })) });
      const updated = [...list];
      if (r.correction && updated.length) updated[updated.length - 1] = { ...updated[updated.length - 1], correction: r.correction };
      setMsgs([...updated, { role: "assistant", content: r.reply, translation: r.translation }]);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  useEffect(() => { send([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const userTurns = msgs.filter((m) => m.role === "user").length;
  return (
    <div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background/80 border border-border/50 text-foreground"}`}>
              <p>{m.content}</p>
              {m.translation && <p className="text-xs italic text-muted-foreground mt-1">{m.translation}</p>}
              {m.correction && <p className="text-xs mt-1 opacity-90">✎ {m.correction}</p>}
            </div>
          </div>
        ))}
        {busy && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!input.trim() || busy) return; const l = [...msgs, { role: "user" as const, content: input.trim() }]; setMsgs(l); setInput(""); send(l); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Napiši odgovor…" />
        <Button type="submit" variant="hero" disabled={busy}><Send className="w-4 h-4" /></Button>
      </form>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-xs text-primary/60">Odgovori bar 3 puta ({Math.min(userTurns, 3)}/3)</span>
        <Button size="sm" variant="hero" disabled={userTurns < 3} onClick={onDone}>Završi razgovor</Button>
      </div>
    </div>
  );
}

function Writing({ lesson, onDone }: { lesson: CourseLesson; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ corrected?: string; feedback?: string; used_words?: string[] } | null>(null);
  const check = async () => {
    setBusy(true);
    try { setRes(await lessonAi({ action: "write", lessonId: lesson.id, text })); } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Napiši 3–5 rečenica na temu „{lesson.title}". Pokušaj da upotrebiš što više reči iz lekcije:</p>
      <div className="flex flex-wrap gap-1.5 mb-3">{lesson.vocabulary.slice(0, 12).map((w) => <span key={w.word} className="text-xs rounded-full border border-border/50 bg-background/60 px-2.5 py-0.5 text-primary">{w.word}</span>)}</div>
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Skriv her…" />
      <div className="mt-3 flex justify-end"><Button variant="hero" disabled={busy || text.trim().length < 10} onClick={check}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Proveri tekst"}</Button></div>
      {res && (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-border/50 bg-background/70 p-4"><p className="text-xs text-primary/60 mb-1">Ispravljen tekst</p><p className="text-foreground">{res.corrected}</p></div>
          <p className="text-sm text-muted-foreground">{res.feedback}</p>
          {!!res.used_words?.length && <p className="text-xs text-forest">Upotrebljene reči iz lekcije: {res.used_words.join(", ")}</p>}
          <div className="flex justify-end"><Button variant="hero" size="sm" onClick={onDone}>Završi</Button></div>
        </div>
      )}
    </div>
  );
}

export default function CourseLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ModuleKey | null>(null);
  const [done, setDone] = useState<ModuleKey[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showTr, setShowTr] = useState(false);
  const [playing, setPlaying] = useState<number | "all" | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [repeated, setRepeated] = useState<number[]>([]);
  const [vocabPhase, setVocabPhase] = useState<"cards" | "quiz">("cards");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId!).maybeSingle();
      setLesson(data as unknown as CourseLesson);
      setLoading(false);
      if (user && data) {
        const { data: p } = await supabase.from("course_lesson_progress").select("status,completed_steps").eq("user_id", user.id).eq("lesson_id", data.id).maybeSingle();
        const keys = MODULES.map((m) => m.key);
        setDone(((p?.completed_steps as string[]) || []).filter((k): k is ModuleKey => keys.includes(k as ModuleKey)));
        setCompleted(p?.status === "completed");
      }
    })();
    return () => { audioRef.current?.pause(); stopRef.current = true; };
  }, [lessonId, user]);

  const words = useMemo(() => lesson ? Array.from(new Set(lesson.text_segments.flatMap((s) => s.text.split(/\s+/)).map(clean).filter((w) => w.length > 2))) : [], [lesson]);
  const vocabQs = useMemo(() => (lesson ? vocabQuestions(lesson) : []), [lesson]);
  const grammarQs = useMemo(() => {
    if (!lesson) return [];
    const ex = lesson.grammar.flatMap((g) => g.examples || []);
    return clozeQuestions(ex.length >= 3 ? ex : lesson.text_segments.map((s) => s.text), words, 6);
  }, [lesson, words]);
  const readingQs = useMemo<Q[]>(() => {
    if (!lesson) return [];
    const withTr = lesson.text_segments.filter((s) => s.translation);
    return shuffle(withTr).slice(0, 6).map((s) => ({
      prompt: s.text, hint: "Šta znači ova rečenica iz teksta?", answer: s.translation!,
      options: shuffle([s.translation!, ...shuffle(withTr.filter((x) => x !== s)).slice(0, 3).map((x) => x.translation!)]),
    }));
  }, [lesson]);
  const listeningQs = useMemo<Q[]>(() => {
    if (!lesson) return [];
    const segs = lesson.text_segments;
    return shuffle(segs).slice(0, 5).map((s) => ({
      prompt: s.text, audio: s.text, hint: "Poslušaj i izaberi rečenicu koju si čuo/la.", answer: s.text,
      options: shuffle([s.text, ...shuffle(segs.filter((x) => x !== s)).slice(0, 3).map((x) => x.text)]),
    }));
  }, [lesson]);

  const playText = async (text: string, idx: number | null = null) => {
    if (!lesson) return;
    setLoadingIdx(idx);
    try {
      const url = await speakUrl(text, lesson.language);
      setLoadingIdx(null);
      audioRef.current?.pause();
      const a = new Audio(url);
      audioRef.current = a;
      await new Promise<void>((res) => { a.onended = () => res(); a.onerror = () => res(); a.play().catch(() => res()); });
    } catch {
      setLoadingIdx(null);
      toast.error("Zvuk trenutno nije dostupan.");
      throw new Error("tts");
    }
  };
  const stop = () => { stopRef.current = true; audioRef.current?.pause(); setPlaying(null); setLoadingIdx(null); };
  const playSegment = async (i: number) => { if (!lesson) return; stop(); stopRef.current = false; setPlaying(i); try { await playText(lesson.text_segments[i].text, i); } catch { /* */ } setPlaying(null); };
  const playAll = async () => {
    if (!lesson) return;
    if (playing === "all") return stop();
    stop(); stopRef.current = false; setPlaying("all");
    for (let i = 0; i < lesson.text_segments.length; i++) { if (stopRef.current) break; try { await playText(lesson.text_segments[i].text, i); } catch { break; } }
    setPlaying(null);
  };

  const finish = async (k: ModuleKey, msg?: string) => {
    if (!user || !lesson) return;
    stop();
    const next = done.includes(k) ? done : [...done, k];
    const all = next.length >= MODULES.length;
    setDone(next);
    setActive(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const { error } = await supabase.from("course_lesson_progress").upsert(
      { user_id: user.id, lesson_id: lesson.id, language: lesson.language, completed_steps: next, status: all ? "completed" : "in_progress", completed_at: all ? new Date().toISOString() : null } as any,
      { onConflict: "user_id,lesson_id" },
    );
    if (error) return toast.error("Čuvanje nije uspelo.");
    if (all && !completed) { setCompleted(true); toast.success("Svi moduli su završeni — lekcija je gotova!"); }
    else toast.success(msg || "Modul je završen.");
  };

  if (loading) return <StudentLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></StudentLayout>;
  if (!lesson) return <StudentLayout><div className="container py-16 text-center text-muted-foreground">Lekcija nije pronađena.</div></StudentLayout>;

  const img = lessonImage(lesson.illustration_url);
  const mod = MODULES.find((m) => m.key === active);

  const SentenceRow = ({ i, right }: { i: number; right?: React.ReactNode }) => {
    const s = lesson.text_segments[i];
    return (
      <div className={`flex gap-3 items-start rounded-xl p-2 transition-colors ${loadingIdx === i || playing === i ? "bg-secondary/50" : ""}`}>
        <button onClick={() => playSegment(i)} aria-label="Slušaj rečenicu" className="mt-0.5 shrink-0 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-primary hover:bg-secondary/60">
          {loadingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <p className="text-foreground">{s.speaker && <span className="font-semibold text-primary">{s.speaker}: </span>}{s.text}</p>
          {showTr && s.translation && <p className="text-sm text-muted-foreground italic">{s.translation}</p>}
        </div>
        {right}
      </div>
    );
  };

  const LessonText = () => (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-primary">{lesson.text_title}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowTr((v) => !v)}>{showTr ? "Sakrij prevod" : "Prikaži prevod"}</Button>
          <Button size="sm" variant="hero" onClick={playAll}>{playing === "all" ? <><Square className="w-4 h-4" /> Zaustavi</> : <><Play className="w-4 h-4" /> Slušaj ceo tekst</>}</Button>
        </div>
      </div>
      <div className="space-y-2">{lesson.text_segments.map((_, i) => <SentenceRow key={i} i={i} />)}</div>
    </>
  );

  return (
    <StudentLayout>
      <div className="container max-w-4xl py-6 sm:py-10">
        <div className="flex items-center gap-2 mb-4">
          {active ? <Button variant="ghost" size="sm" onClick={() => { stop(); setActive(null); }}><ArrowLeft className="w-4 h-4" /> Nazad na lekciju</Button> : <BackButton to="/dashboard" />}
          <span className="text-sm text-primary/60">Lekcija {lesson.sort_order} · {lesson.cefr_level}</span>
        </div>

        {!active && (
          <>
            <header className="mb-5">
              <p className="font-script italic text-primary/60">{lesson.title_target}</p>
              <h1 className="text-display text-3xl sm:text-4xl text-primary leading-tight">{lesson.title}</h1>
              <p className="mt-2 text-muted-foreground">{lesson.summary}</p>
            </header>
            {img && <img src={img} alt={lesson.title} width={1280} height={720} className="w-full rounded-3xl border border-border/50 shadow-postcard aspect-video object-cover mb-6" />}
            <section className="rounded-3xl border border-border/60 bg-cream p-5 sm:p-7 shadow-card-soft mb-8"><LessonText /></section>

            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="font-script italic text-primary/60">Læringsmoduler</p>
                <h2 className="font-display text-2xl text-primary">Moduli ove lekcije</h2>
              </div>
              <span className="text-sm text-primary/70">{done.length} / {MODULES.length}</span>
            </div>
            <Progress value={(done.length / MODULES.length) * 100} className="h-1.5 mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODULES.map((m) => (
                <button key={m.key} onClick={() => { stop(); setVocabPhase("cards"); setRepeated([]); setActive(m.key); window.scrollTo({ top: 0 }); }}
                  className="group text-left rounded-3xl border border-border/60 bg-cream shadow-card-soft overflow-hidden hover:-translate-y-0.5 transition-transform">
                  <div className={`h-20 ${m.tone} relative`}>
                    <span className="absolute left-5 -bottom-5 w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-card-soft"><m.icon className="w-5 h-5" /></span>
                    {done.includes(m.key) && <CheckCircle2 className="absolute right-4 top-4 w-5 h-5 text-forest" />}
                  </div>
                  <div className="px-5 pt-8 pb-5">
                    <p className="font-script italic text-sm text-primary/60">{m.sub}</p>
                    <h3 className="font-display text-xl text-primary">{m.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {completed && <p className="mt-8 flex justify-center items-center gap-2 text-forest font-medium"><CheckCircle2 className="w-5 h-5" /> Lekcija je završena</p>}
          </>
        )}

        {mod && (
          <section className="rounded-3xl border border-border/60 bg-cream p-5 sm:p-7 shadow-card-soft">
            <p className="font-script italic text-primary/60">{mod.sub} · {lesson.title_target}</p>
            <h1 className="font-display text-2xl sm:text-3xl text-primary mb-5 flex items-center gap-2"><mod.icon className="w-6 h-6" /> {mod.title}</h1>

            {active === "citanje" && (
              <>
                <LessonText />
                <h3 className="font-semibold text-primary mt-8 mb-2">Razumevanje teksta</h3>
                <Quiz questions={readingQs} onDone={(sc) => finish("citanje", `Čitanje: ${sc} / ${readingQs.length}`)} />
              </>
            )}

            {active === "slusanje" && (
              <Quiz questions={listeningQs} onPlay={(t) => { stop(); stopRef.current = false; playText(t).catch(() => {}); }} onDone={(sc) => finish("slusanje", `Slušanje: ${sc} / ${listeningQs.length}`)} />
            )}

            {active === "vokabular" && (vocabPhase === "cards"
              ? <Flashcards lesson={lesson} onDone={() => setVocabPhase("quiz")} />
              : <Quiz questions={vocabQs} onDone={(sc) => finish("vokabular", `Vokabular: ${sc} / ${vocabQs.length}`)} />)}

            {active === "gramatika" && (
              <>
                <div className="space-y-3 mb-6">
                  {lesson.grammar.map((g) => (
                    <div key={g.title} className="rounded-2xl border border-border/50 bg-background/60 p-4">
                      <h3 className="font-semibold text-primary">{g.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{g.explanation}</p>
                      {g.examples?.length ? <ul className="mt-2 space-y-1 text-sm">{g.examples.map((e) => <li key={e}>• {e}</li>)}</ul> : null}
                    </div>
                  ))}
                </div>
                <h3 className="font-semibold text-primary mb-2">Vežba</h3>
                <Quiz questions={grammarQs} onDone={(sc) => finish("gramatika", `Gramatika: ${sc} / ${grammarQs.length}`)} />
              </>
            )}

            {active === "izgovor" && (
              <>
                <p className="text-sm text-muted-foreground mb-4">Poslušaj svaku rečenicu, ponovi je naglas i označi kad je uvežbaš.</p>
                <div className="space-y-2">
                  {lesson.text_segments.map((_, i) => (
                    <SentenceRow key={i} i={i} right={
                      <button onClick={() => setRepeated((r) => r.includes(i) ? r : [...r, i])} aria-label="Ponovio/la sam"
                        className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${repeated.includes(i) ? "bg-forest/10 border-forest/50 text-forest" : "border-border/60 text-primary/50"}`}>
                        <Check className="w-4 h-4" />
                      </button>} />
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-xs text-primary/60">{repeated.length} / {lesson.text_segments.length} uvežbano</span>
                  <Button variant="hero" disabled={repeated.length < Math.ceil(lesson.text_segments.length / 2)} onClick={() => finish("izgovor")}>Završi</Button>
                </div>
              </>
            )}

            {active === "razgovor" && <Chat lesson={lesson} onDone={() => finish("razgovor")} />}
            {active === "pisanje" && <Writing lesson={lesson} onDone={() => finish("pisanje")} />}

            {done.includes(active!) && <p className="mt-6 text-xs text-forest flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Ovaj modul si već završio/la — možeš ga ponoviti.</p>}
          </section>
        )}
      </div>
    </StudentLayout>
  );
}
