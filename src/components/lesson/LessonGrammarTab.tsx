import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Volume2, BookOpen } from "lucide-react";
import { loadLessonContent, speakLines, type Exercise, type LessonContent } from "@/lib/courseLessons";

function Table({ head, rows }: { head?: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-sm">
        {head && <thead className="bg-secondary/50"><tr>{head.map((h) => <th key={h} className="text-left px-3 py-2 font-semibold text-primary">{h}</th>)}</tr></thead>}
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border/40">{r.map((c, j) => <td key={j} className="px-3 py-1.5">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Lesson grammar material + exercises, shown as the first tab inside the regular Grammar module. */
export default function LessonGrammarTab({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
      if (!data) return;
      setRow(data);
      setContent(await loadLessonContent(data as any));
      if (user) {
        const { data: p } = await supabase.from("course_lesson_progress").select("completed_steps").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle();
        if (p && Array.isArray(p.completed_steps)) setDone(p.completed_steps as string[]);
      }
    })();
  }, [lessonId, user]);

  if (!row || !content) return <div className="py-10 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  const g = content.modules.grammar;
  if (!g) return <p className="text-sm text-muted-foreground">Ova lekcija nema gramatički deo.</p>;
  const lang = row.language || "en";

  async function markDone(code: string) {
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
  }

  const exercises: Exercise[] = g.exercises || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="w-4 h-4" />
        <p className="text-sm font-medium">Lekcija {row.sort_order}: {row.title_target}</p>
      </div>
      {g.sections?.map((s: any) => (
        <div key={s.title} className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-3">
          <h3 className="font-display font-semibold text-lg text-primary">{s.title}</h3>
          <p className="text-sm leading-relaxed">{s.explanation}</p>
          {s.table && <Table rows={s.table} />}
          {s.rules && <ul className="list-disc pl-5 text-sm space-y-1">{s.rules.map((r: string) => <li key={r}>{r}</li>)}</ul>}
          {s.compare && <p className="text-sm bg-secondary/40 rounded-lg p-3"><strong>Poređenje sa srpskim:</strong> {s.compare}</p>}
          {s.examples && (
            <ul className="space-y-1.5">
              {s.examples.map((e: string[]) => (
                <li key={e[0]} className="flex items-start gap-2 text-sm">
                  <button type="button" onClick={() => speakLines([{ speaker: "m", text: e[0] }], lang)} className="text-primary/60 hover:text-primary mt-0.5" aria-label={`Izgovori ${e[0]}`}><Volume2 className="w-4 h-4" /></button>
                  <span><strong>{e[0]}</strong> <span className="text-muted-foreground">— {e[1]}</span></span>
                </li>
              ))}
            </ul>
          )}
          {s.mistakes && <Table head={["Pogrešno", "Ispravno", "Zašto"]} rows={s.mistakes} />}
          {s.remember && <p className="text-sm font-medium text-primary">📌 {s.remember}</p>}
        </div>
      ))}
      {exercises.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl text-primary">Vežbe lekcije ({exercises.filter((e) => done.includes(e.code)).length}/{exercises.length})</h3>
          {exercises.map((ex) => (
            <LessonExercise key={ex.id} exercise={ex} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={done.includes(ex.code)} onDone={markDone} />
          ))}
        </div>
      )}
    </div>
  );
}
