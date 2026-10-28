import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { loadLessonContent, type Exercise } from "@/lib/courseLessons";
import { logActivity } from "@/lib/logActivity";
import LessonExercise from "./LessonExercise";
import { completeLessonExercise } from "@/lib/lessonRewards";
import { toast } from "sonner";

// Prepared writing tasks of one lesson, shown one at a time (1..N stepper).
export default function LessonWritingTab({ lessonId, language, level, onOpenFree }: {
  lessonId: string; language: "no" | "en" | "de"; level: string; onOpenFree: () => void;
}) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle().then(async ({ data }) => {
      if (!data) { setExercises([]); return; }
      const c = await loadLessonContent(data as any);
      setTitle((data as any).title_target || "");
      setCode((data as any).lesson_code || c.code);
      setExercises((c.modules?.writing?.exercises as Exercise[]) || []);
    });
  }, [lessonId]);

  // Merge saved lesson progress so completion survives devices and counts toward the lesson.
  useEffect(() => {
    if (!user) return;
    supabase.from("course_lesson_progress").select("completed_steps").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle()
      .then(({ data }) => {
        if (data && Array.isArray(data.completed_steps)) setDone((d) => Array.from(new Set([...d, ...(data.completed_steps as string[])])));
      });
  }, [user, lessonId]);

  const markDone = async (exCode: string) => {
    if (!user) return;
    try {
      await completeLessonExercise(lessonId, exCode);
      const { data: p } = await supabase.from("course_lesson_progress").select("completed_steps").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle();
      if (Array.isArray(p?.completed_steps)) setDone(p.completed_steps as string[]);
    } catch { toast.error("Poeni nisu sačuvani. Pokušaj ponovo."); }
  };

  if (!exercises) return <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!exercises.length) return <p className="text-sm text-muted-foreground py-6">Ova lekcija nema pripremljene zadatke za pisanje.</p>;
  const ex = exercises[idx];

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/50 bg-cream/90 shadow-postcard p-5">
        <p className="font-script italic text-primary/60 text-sm">{title}</p>
        <h2 className="text-display text-xl text-primary mt-1">Obavezna vežbanja</h2>
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
          {exercises.map((e, i) => (
            <button key={e.code} onClick={() => setIdx(i)}
              className={`shrink-0 w-9 h-9 rounded-full text-sm font-medium border transition flex items-center justify-center ${i === idx ? "bg-primary text-primary-foreground border-primary" : done.includes(e.code) ? "bg-accent/30 text-primary border-accent" : "bg-background text-muted-foreground border-border"}`}>
              {done.includes(e.code) && i !== idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </button>
          ))}
        </div>
      </div>

      <LessonExercise key={ex.code} exercise={ex} language={language} level={level} lessonTitle={title}
        done={done.includes(ex.code)} onDone={markDone} />

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft className="w-4 h-4" /> Nazad</Button>
        {idx < exercises.length - 1
          ? <Button size="sm" onClick={() => setIdx(idx + 1)}>Sledeći <ChevronRight className="w-4 h-4" /></Button>
          : <Button size="sm" onClick={onOpenFree}>Samostalna vežba</Button>}
      </div>
    </div>
  );
}
