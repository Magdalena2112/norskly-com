import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Volume2, Play, Square, Loader2, Languages, BookOpen, MessageSquare, Mic, Headphones, PenLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/student/StudentLayout";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { lessonImage, speakUrl, type CourseLesson } from "@/lib/courseLessons";

export default function CourseLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTr, setShowTr] = useState(false);
  const [playing, setPlaying] = useState<number | "all" | null>(null);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId!).maybeSingle();
      setLesson(data as unknown as CourseLesson);
      setLoading(false);
      if (user && data) {
        const { data: p } = await supabase.from("course_lesson_progress").select("status").eq("user_id", user.id).eq("lesson_id", data.id).maybeSingle();
        setCompleted(p?.status === "completed");
      }
    })();
    return () => { audioRef.current?.pause(); stopRef.current = true; };
  }, [lessonId, user]);

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

  const playSegment = async (i: number) => {
    stop(); stopRef.current = false; setPlaying(i);
    try { await playOne(i); } catch { /* handled */ }
    setPlaying(null);
  };

  const playAll = async () => {
    if (!lesson) return;
    if (playing === "all") return stop();
    stop(); stopRef.current = false; setPlaying("all");
    for (let i = 0; i < lesson.text_segments.length; i++) {
      if (stopRef.current) break;
      try { await playOne(i); } catch { break; }
    }
    setPlaying(null);
  };

  const markDone = async () => {
    if (!user || !lesson) return;
    const { error } = await supabase.from("course_lesson_progress").upsert(
      { user_id: user.id, lesson_id: lesson.id, language: lesson.language, status: "completed", completed_at: new Date().toISOString() },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) return toast.error("Čuvanje nije uspelo.");
    setCompleted(true);
    toast.success("Lekcija je označena kao završena.");
  };

  if (loading) return <StudentLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></StudentLayout>;
  if (!lesson) return <StudentLayout><div className="container py-16 text-center text-muted-foreground">Lekcija nije pronađena.</div></StudentLayout>;

  const img = lessonImage(lesson.illustration_url);
  const practice = [
    { label: "Vokabular", icon: Languages, to: "/vocabulary" },
    { label: "Gramatika", icon: BookOpen, to: "/grammar" },
    { label: "Slušanje", icon: Headphones, to: "/listening" },
    { label: "Izgovor", icon: Mic, to: "/pronunciation" },
    { label: "Razgovor", icon: MessageSquare, to: "/talk" },
    { label: "Pisanje", icon: PenLine, to: "/writing" },
  ];

  return (
    <StudentLayout>
      <div className="container max-w-3xl py-6 sm:py-10">
        <div className="flex items-center gap-2 mb-4">
          <BackButton to="/dashboard" />
          <span className="text-sm text-primary/60">Lekcija {lesson.sort_order} · {lesson.cefr_level}</span>
        </div>

        <header className="mb-6">
          <p className="font-script italic text-primary/60">{lesson.title_target}</p>
          <h1 className="text-display text-3xl sm:text-4xl text-primary leading-tight">{lesson.title}</h1>
          <p className="mt-2 text-muted-foreground">{lesson.summary}</p>
        </header>

        {img && <img src={img} alt={lesson.title} width={1280} height={720} className="w-full rounded-3xl border border-border/50 shadow-postcard aspect-video object-cover mb-6" />}

        {lesson.goals.length > 0 && (
          <ul className="mb-8 flex flex-wrap gap-2">
            {lesson.goals.map((g) => <li key={g} className="text-xs bg-secondary/60 text-primary px-3 py-1 rounded-full border border-border/50">{g}</li>)}
          </ul>
        )}

        {/* Lesson text */}
        <section className="rounded-3xl border border-border/60 bg-cream p-5 sm:p-7 shadow-card-soft mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-display text-xl text-primary">{lesson.text_title}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowTr((v) => !v)}>{showTr ? "Sakrij prevod" : "Prikaži prevod"}</Button>
              <Button size="sm" variant="hero" onClick={playAll}>
                {playing === "all" ? <><Square className="w-4 h-4" /> Zaustavi</> : <><Play className="w-4 h-4" /> Slušaj ceo tekst</>}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {lesson.text_segments.map((s, i) => {
              const active = loadingIdx === i || (playing !== null && audioRef.current && playing === i);
              return (
                <div key={i} className={`flex gap-3 items-start rounded-xl p-2 transition-colors ${active ? "bg-secondary/50" : ""}`}>
                  <button onClick={() => playSegment(i)} aria-label="Slušaj rečenicu" className="mt-0.5 shrink-0 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-primary hover:bg-secondary/60">
                    {loadingIdx === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className="text-foreground">{s.speaker && <span className="font-semibold text-primary">{s.speaker}: </span>}{s.text}</p>
                    {showTr && s.translation && <p className="text-sm text-muted-foreground italic">{s.translation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {lesson.vocabulary.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-xl text-primary mb-3">Reči iz lekcije</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lesson.vocabulary.map((w) => (
                <div key={w.word} className="flex justify-between gap-3 rounded-xl border border-border/50 bg-cream/70 px-4 py-2 text-sm">
                  <span className="font-medium text-primary">{w.word}</span>
                  <span className="text-muted-foreground text-right">{w.translation}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {lesson.grammar.length > 0 && (
          <section className="mb-8">
            <h2 className="font-display text-xl text-primary mb-3">Gramatika</h2>
            <div className="space-y-3">
              {lesson.grammar.map((g) => (
                <div key={g.title} className="rounded-2xl border border-border/50 bg-cream/70 p-4">
                  <h3 className="font-semibold text-primary">{g.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{g.explanation}</p>
                  {g.examples && g.examples.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">{g.examples.map((e) => <li key={e} className="text-foreground">• {e}</li>)}</ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="font-display text-xl text-primary mb-3">Vežbaj dalje</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {practice.map((p) => (
              <button key={p.to} onClick={() => navigate(p.to)} className="flex items-center gap-2 rounded-xl border border-border/60 bg-cream px-4 py-3 text-sm text-primary hover:bg-secondary/50 transition-colors">
                <p.icon className="w-4 h-4" /> {p.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-center">
          {completed
            ? <p className="flex items-center gap-2 text-forest font-medium"><CheckCircle2 className="w-5 h-5" /> Lekcija je završena</p>
            : <Button variant="hero" onClick={markDone}>Označi lekciju kao završenu</Button>}
        </div>
      </div>
    </StudentLayout>
  );
}
