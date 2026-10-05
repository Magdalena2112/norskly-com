import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Volume2, Play, Square, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { lessonImage, speakUrl, type CourseLesson } from "@/lib/courseLessons";

const STEPS = ["Tekst", "Reči", "Gramatika", "Izgovor", "Završni kviz"] as const;

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

interface Q { prompt: string; hint?: string; options: string[]; answer: string }

function vocabQuestions(l: CourseLesson): Q[] {
  const all = l.vocabulary;
  return shuffle(all).slice(0, 8).map((w) => ({
    prompt: w.word,
    hint: "Šta znači ova reč?",
    answer: w.translation,
    options: shuffle([w.translation, ...shuffle(all.filter((x) => x.word !== w.word)).slice(0, 3).map((x) => x.translation)]),
  }));
}

function clozeQuestions(sentences: string[], pool: string[], n: number): Q[] {
  const qs: Q[] = [];
  for (const s of shuffle(sentences)) {
    const words = s.split(/\s+/).filter((w) => w.replace(/[^\p{L}]/gu, "").length > 2);
    if (!words.length) continue;
    const target = words[Math.floor(Math.random() * words.length)];
    const clean = target.replace(/[^\p{L}]/gu, "");
    const distract = shuffle(pool.filter((p) => p.toLowerCase() !== clean.toLowerCase())).slice(0, 3);
    if (distract.length < 2) continue;
    qs.push({ prompt: s.replace(clean, "_____"), hint: "Dopuni rečenicu.", answer: clean, options: shuffle([clean, ...distract]) });
    if (qs.length >= n) break;
  }
  return qs;
}

function Quiz({ questions, onDone }: { questions: Q[]; onDone: (score: number) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  if (!questions.length) return <Button variant="hero" onClick={() => onDone(0)}>Nastavi</Button>;
  const q = questions[i];
  const next = () => {
    if (i + 1 >= questions.length) onDone(score);
    else { setI(i + 1); setPicked(null); }
  };
  return (
    <div>
      <p className="text-xs text-primary/60 mb-2">{i + 1} / {questions.length}</p>
      {q.hint && <p className="text-sm text-muted-foreground">{q.hint}</p>}
      <p className="font-display text-2xl text-primary my-3">{q.prompt}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((o) => {
          const state = picked ? (o === q.answer ? "ok" : o === picked ? "bad" : "") : "";
          return (
            <button key={o} disabled={!!picked}
              onClick={() => { setPicked(o); if (o === q.answer) setScore((s) => s + 1); }}
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

export default function CourseLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showTr, setShowTr] = useState(false);
  const [playing, setPlaying] = useState<number | "all" | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [repeated, setRepeated] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId!).maybeSingle();
      setLesson(data as unknown as CourseLesson);
      setLoading(false);
      if (user && data) {
        const { data: p } = await supabase.from("course_lesson_progress").select("status,completed_steps").eq("user_id", user.id).eq("lesson_id", data.id).maybeSingle();
        const steps = ((p?.completed_steps as number[]) || []).filter((n) => typeof n === "number");
        setDone(steps);
        setCompleted(p?.status === "completed");
        const firstOpen = STEPS.findIndex((_, i) => !steps.includes(i));
        setStep(firstOpen < 0 ? 0 : firstOpen);
      }
    })();
    return () => { audioRef.current?.pause(); stopRef.current = true; };
  }, [lessonId, user]);

  const vocabQs = useMemo(() => (lesson ? vocabQuestions(lesson) : []), [lesson]);
  const grammarQs = useMemo(() => {
    if (!lesson) return [];
    const ex = lesson.grammar.flatMap((g) => g.examples || []);
    const pool = Array.from(new Set(lesson.text_segments.flatMap((s) => s.text.split(/\s+/)).map((w) => w.replace(/[^\p{L}]/gu, "")).filter((w) => w.length > 2)));
    return clozeQuestions(ex.length >= 3 ? ex : lesson.text_segments.map((s) => s.text), pool, 6);
  }, [lesson]);
  const finalQs = useMemo(() => {
    if (!lesson) return [];
    const pool = lesson.vocabulary.map((w) => w.word.split(" ").pop()!.replace(/[^\p{L}]/gu, ""));
    return shuffle([...vocabQuestions(lesson).slice(0, 4), ...clozeQuestions(lesson.text_segments.map((s) => s.text), pool.concat(lesson.text_segments.flatMap((s) => s.text.split(/\s+/)).map((w) => w.replace(/[^\p{L}]/gu, ""))), 4)]);
  }, [lesson]);

  const playOne = async (i: number): Promise<void> => {
    if (!lesson) return;
    setLoadingIdx(i);
    try {
      const url = await speakUrl(lesson.text_segments[i].text, lesson.language);
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
  const playSegment = async (i: number) => { stop(); stopRef.current = false; setPlaying(i); try { await playOne(i); } catch { /* */ } setPlaying(null); };
  const playAll = async () => {
    if (!lesson) return;
    if (playing === "all") return stop();
    stop(); stopRef.current = false; setPlaying("all");
    for (let i = 0; i < lesson.text_segments.length; i++) { if (stopRef.current) break; try { await playOne(i); } catch { break; } }
    setPlaying(null);
  };

  const finishStep = async (s: number) => {
    if (!user || !lesson) return;
    stop();
    const next = done.includes(s) ? done : [...done, s].sort();
    const all = next.length >= STEPS.length;
    setDone(next);
    const { error } = await supabase.from("course_lesson_progress").upsert(
      { user_id: user.id, lesson_id: lesson.id, language: lesson.language, completed_steps: next, status: all ? "completed" : "in_progress", completed_at: all ? new Date().toISOString() : null } as any,
      { onConflict: "user_id,lesson_id" },
    );
    if (error) return toast.error("Čuvanje nije uspelo.");
    if (all && !completed) { setCompleted(true); toast.success("Lekcija je završena!"); }
    if (s < STEPS.length - 1) { setStep(s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  if (loading) return <StudentLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></StudentLayout>;
  if (!lesson) return <StudentLayout><div className="container py-16 text-center text-muted-foreground">Lekcija nije pronađena.</div></StudentLayout>;

  const img = lessonImage(lesson.illustration_url);
  const unlocked = (i: number) => i === 0 || done.includes(i - 1) || done.includes(i);

  const SentenceRow = ({ i, children }: { i: number; children?: React.ReactNode }) => {
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
        {children}
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="container max-w-3xl py-6 sm:py-10">
        <div className="flex items-center gap-2 mb-4">
          <BackButton to="/dashboard" />
          <span className="text-sm text-primary/60">Lekcija {lesson.sort_order} · {lesson.cefr_level}</span>
        </div>

        <header className="mb-5">
          <p className="font-script italic text-primary/60">{lesson.title_target}</p>
          <h1 className="text-display text-3xl sm:text-4xl text-primary leading-tight">{lesson.title}</h1>
        </header>

        {/* Stepper */}
        <div className="mb-6">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button key={s} disabled={!unlocked(i)} onClick={() => { stop(); setStep(i); }}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border transition-colors disabled:opacity-40 ${step === i ? "bg-primary text-primary-foreground border-primary" : done.includes(i) ? "border-forest/50 text-forest bg-forest/5" : "border-border/60 text-primary"}`}>
                {done.includes(i) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>} {s}
              </button>
            ))}
          </div>
          <Progress value={(done.length / STEPS.length) * 100} className="h-1.5 mt-3" />
        </div>

        <section className="rounded-3xl border border-border/60 bg-cream p-5 sm:p-7 shadow-card-soft mb-6">
          {step === 0 && (
            <>
              <p className="text-muted-foreground mb-4">{lesson.summary}</p>
              {img && <img src={img} alt={lesson.title} width={1280} height={720} className="w-full rounded-2xl border border-border/50 aspect-video object-cover mb-5" />}
              {lesson.goals.length > 0 && (
                <ul className="mb-5 flex flex-wrap gap-2">{lesson.goals.map((g) => <li key={g} className="text-xs bg-secondary/60 text-primary px-3 py-1 rounded-full border border-border/50">{g}</li>)}</ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-xl text-primary">{lesson.text_title}</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowTr((v) => !v)}>{showTr ? "Sakrij prevod" : "Prikaži prevod"}</Button>
                  <Button size="sm" variant="hero" onClick={playAll}>{playing === "all" ? <><Square className="w-4 h-4" /> Zaustavi</> : <><Play className="w-4 h-4" /> Slušaj ceo tekst</>}</Button>
                </div>
              </div>
              <div className="space-y-2">{lesson.text_segments.map((_, i) => <SentenceRow key={i} i={i} />)}</div>
              <div className="mt-6 flex justify-end"><Button variant="hero" onClick={() => finishStep(0)}>Pročitao/la sam tekst <ArrowRight className="w-4 h-4" /></Button></div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-display text-xl text-primary mb-3">Reči iz lekcije</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {lesson.vocabulary.map((w) => (
                  <div key={w.word} className="flex justify-between gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-2 text-sm">
                    <span className="font-medium text-primary">{w.word}</span><span className="text-muted-foreground text-right">{w.translation}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold text-primary mb-2">Proveri reči</h3>
              <Quiz key="v" questions={vocabQs} onDone={(sc) => { toast.success(`Tačno: ${sc} / ${vocabQs.length}`); finishStep(1); }} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display text-xl text-primary mb-3">Gramatika</h2>
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
              <Quiz key="g" questions={grammarQs} onDone={(sc) => { toast.success(`Tačno: ${sc} / ${grammarQs.length}`); finishStep(2); }} />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display text-xl text-primary mb-1">Izgovor</h2>
              <p className="text-sm text-muted-foreground mb-4">Poslušaj svaku rečenicu, ponovi je naglas i označi kad je uvežbaš.</p>
              <div className="space-y-2">
                {lesson.text_segments.map((_, i) => (
                  <SentenceRow key={i} i={i}>
                    <button onClick={() => setRepeated((r) => r.includes(i) ? r : [...r, i])} aria-label="Ponovio/la sam"
                      className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${repeated.includes(i) ? "bg-forest/10 border-forest/50 text-forest" : "border-border/60 text-primary/50"}`}>
                      <Check className="w-4 h-4" />
                    </button>
                  </SentenceRow>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-primary/60">{repeated.length} / {lesson.text_segments.length} uvežbano</span>
                <Button variant="hero" disabled={repeated.length < Math.ceil(lesson.text_segments.length / 2)} onClick={() => finishStep(3)}>Dalje <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-display text-xl text-primary mb-3">Završni kviz</h2>
              {quizResult ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-forest mx-auto mb-2" />
                  <p className="font-display text-2xl text-primary">{quizResult}</p>
                  <p className="text-muted-foreground mt-1">Lekcija je završena. Odlično!</p>
                  <Button className="mt-5" variant="outline" onClick={() => setQuizResult(null)}>Ponovi kviz</Button>
                </div>
              ) : (
                <Quiz key="f" questions={finalQs} onDone={(sc) => { setQuizResult(`Rezultat: ${sc} / ${finalQs.length}`); finishStep(4); }} />
              )}
            </>
          )}
        </section>

        <div className="flex justify-between">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => { stop(); setStep(step - 1); }}><ArrowLeft className="w-4 h-4" /> Prethodni korak</Button>
          {completed && <p className="flex items-center gap-2 text-forest text-sm font-medium"><CheckCircle2 className="w-4 h-4" /> Lekcija završena</p>}
        </div>
      </div>
    </StudentLayout>
  );
}
