import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Button } from "@/components/ui/button";
import { Volume2, BookOpen, CheckCircle2, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import { loadLessonContent, speakLines, type Exercise, type LessonContent } from "@/lib/courseLessons";
import { LESSON_IMAGES } from "@/content/lessons/images";

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

interface Topic {
  label: string;
  sectionIdx: number[];
  exercises: string[];
  aiTopic: string;
  related: { title: string; query: string }[];
}

/** Topic grouping per lesson; sections without config become one topic each. */
const TOPICS: Record<string, Topic[]> = {
  "EN-A1-L01": [
    { label: "Lične zamenice", sectionIdx: [0], exercises: ["GR-03"], aiTopic: "Personal pronouns (I, you, he, she, it, we, they)",
      related: [{ title: "Prisvojni pridevi (my, your, his…)", query: "Possessive adjectives my, your, his, her" }, { title: "Objektne zamenice (me, him, her…)", query: "Object pronouns me, him, her, us, them" }] },
    { label: "Glagol to be", sectionIdx: [1], exercises: ["GR-01", "GR-02", "GR-04", "GR-05", "GR-06"], aiTopic: "Verb to be – affirmative (am, is, are) and contractions",
      related: [{ title: "Odrični oblik (I am not…)", query: "Verb to be negative form" }, { title: "Upitni oblik (Are you…?)", query: "Verb to be questions" }] },
    { label: "Članovi a / an", sectionIdx: [2], exercises: ["GR-07"], aiTopic: "Indefinite articles a / an",
      related: [{ title: "Množina imenica", query: "Plural nouns in English" }, { title: "Određeni član the", query: "Definite article the" }] },
    { label: "Fraze i sažetak", sectionIdx: [3, 4], exercises: ["GR-08", "GR-09", "GR-10"], aiTopic: "Basic questions with to be (What is your name? Where are you from?)",
      related: [{ title: "Upitne reči (what, where, who)", query: "Question words what, where, who, how" }] },
  ],
};

export default function LessonGrammarTab({ lessonId, onPractice, onExplain }: {
  lessonId: string; onPractice?: (topic: string) => void; onExplain?: (topic: string) => void;
}) {
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState(0);

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
  const sections: any[] = g.sections || [];
  const exercises: Exercise[] = g.exercises || [];
  const images = LESSON_IMAGES[row.lesson_code]?.modules.grammar || [];

  const topics: Topic[] = TOPICS[row.lesson_code] || sections.map((s, i) => ({
    label: s.title.replace(/^\d+(\.\d+)?\s*/, ""), sectionIdx: [i], exercises: [], aiTopic: s.title, related: [],
  }));
  const unassigned = exercises.filter((e) => !topics.some((t) => t.exercises.includes(e.code)));
  if (unassigned.length) topics[topics.length - 1] = { ...topics[topics.length - 1], exercises: [...topics[topics.length - 1].exercises, ...unassigned.map((e) => e.code)] };

  async function markDone(code: string) {
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
  }

  const topic = topics[active];
  const topicEx = exercises.filter((e) => topic.exercises.includes(e.code));
  const isTopicDone = (t: Topic) => t.exercises.length > 0 && t.exercises.every((c) => done.includes(c));
  const img = images.length ? images[active % images.length] : undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="w-4 h-4" />
        <p className="text-sm font-medium">Lekcija {row.sort_order}: {row.title_target}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {topics.map((t, i) => (
          <button key={t.label} type="button" onClick={() => setActive(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${i === active ? "bg-primary text-primary-foreground border-primary" : "bg-cream/90 border-border hover:border-primary/50 text-foreground"}`}>
            {isTopicDone(t) && <CheckCircle2 className={`w-3.5 h-3.5 ${i === active ? "" : "text-forest"}`} />}
            <span>{i + 1}. {t.label}</span>
          </button>
        ))}
      </div>

      {img && <img src={img} alt={topic.label} loading="lazy" className="w-full max-h-72 object-cover rounded-2xl border border-border/60 shadow-card-soft" />}

      {topic.sectionIdx.map((si) => sections[si]).filter(Boolean).map((s: any) => (
        <div key={s.title} className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-3">
          <h3 className="font-display font-semibold text-lg text-primary">{s.title}</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line">{s.explanation}</p>
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

      {topicEx.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl text-primary">Provežbaj ovu temu ({topicEx.filter((e) => done.includes(e.code)).length}/{topicEx.length})</h3>
          {topicEx.map((ex) => (
            <LessonExercise key={ex.id} exercise={ex} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={done.includes(ex.code)} onDone={markDone} />
          ))}
        </div>
      )}

      {onPractice && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm flex-1">Želiš još vežbe? AI će napraviti nove zadatke baš za ovu temu.</p>
          <Button variant="hero" size="sm" onClick={() => onPractice(topic.aiTopic)}>
            <Sparkles className="w-4 h-4" /> Provežbaj
          </Button>
        </div>
      )}

      {topic.related.length > 0 && onExplain && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Povezane gramatičke oblasti</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {topic.related.map((r) => (
              <button key={r.title} type="button" onClick={() => onExplain(r.query)}
                className="text-left rounded-xl border border-border/60 bg-cream/90 px-3 py-2.5 text-sm hover:border-primary/50 transition-colors flex items-center justify-between gap-2">
                <span>{r.title}</span><ArrowRight className="w-4 h-4 text-primary/60 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {active < topics.length - 1 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { setActive(active + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Sledeća tema: {topics[active + 1].label} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
