import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Button } from "@/components/ui/button";
import { Volume2, BookOpen, CheckCircle2, Sparkles, ArrowRight, Lightbulb, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
export const LESSON_GRAMMAR_TOPICS: Record<string, Topic[]> = {
  "EN-A1-L01": [
    { label: "Lične zamenice", sectionIdx: [0], exercises: ["PR-01","PR-02","PR-03","PR-04","PR-05","PR-06","PR-07","PR-08","PR-09","PR-10"], aiTopic: "Personal pronouns (I, you, he, she, it, we, they)",
      related: [{ title: "Prisvojni pridevi (my, your, his…)", query: "Possessive adjectives my, your, his, her" }, { title: "Objektne zamenice (me, him, her…)", query: "Object pronouns me, him, her, us, them" }] },
    { label: "Glagol to be", sectionIdx: [1], exercises: ["TB-01","TB-02","TB-03","TB-04","TB-05","TB-06","TB-07","TB-08","TB-09","TB-10"], aiTopic: "Verb to be – affirmative (am, is, are) and contractions",
      related: [{ title: "Odrični oblik (I am not…)", query: "Verb to be negative form" }, { title: "Upitni oblik (Are you…?)", query: "Verb to be questions" }] },
    { label: "Članovi a / an", sectionIdx: [2], exercises: ["AR-01","AR-02","AR-03","AR-04","AR-05","AR-06","AR-07","AR-08","AR-09","AR-10"], aiTopic: "Indefinite articles a / an",
      related: [{ title: "Množina imenica", query: "Plural nouns in English" }, { title: "Određeni član the", query: "Definite article the" }] },
  ],
};

export default function LessonGrammarTab({ lessonId, onPractice, onExplain, mode = "theory", initialTopic = 0, onTopicChange, renderMore }: {
  lessonId: string; onPractice?: (topicIndex: number) => void; onExplain?: (topic: string) => void;
  mode?: "theory" | "practice"; initialTopic?: number; onTopicChange?: (i: number) => void;
  renderMore?: (aiTopic: string) => React.ReactNode;
}) {
  const [showMore, setShowMore] = useState(false);
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState(initialTopic);
  useEffect(() => { setActive(initialTopic); }, [initialTopic]);
  const [exIdx, setExIdx] = useState(0);
  useEffect(() => { setExIdx(0); }, [active]);
  useEffect(() => { setShowMore(false); }, [active]);

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

  const topics: Topic[] = LESSON_GRAMMAR_TOPICS[row.lesson_code] || sections.map((s, i) => ({
    label: s.title.replace(/^\d+(\.\d+)?\s*/, ""), sectionIdx: [i], exercises: [], aiTopic: s.title, related: [],
  }));
  const unassigned = exercises.filter((e) => !topics.some((t) => t.exercises.includes(e.code)));
  if (unassigned.length && !LESSON_GRAMMAR_TOPICS[row.lesson_code]) topics[topics.length - 1] = { ...topics[topics.length - 1], exercises: [...topics[topics.length - 1].exercises, ...unassigned.map((e) => e.code)] };

  async function markDone(code: string) {
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
  }

  const topic = topics[Math.min(Math.max(active, 0), topics.length - 1)] ?? topics[0];
  const topicEx = topic ? exercises.filter((e) => topic.exercises.includes(e.code)) : [];
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
          <button key={t.label} type="button" onClick={() => { setActive(i); onTopicChange?.(i); }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${i === active ? "bg-primary text-primary-foreground border-primary" : "bg-cream/90 border-border hover:border-primary/50 text-foreground"}`}>
            {isTopicDone(t) && <CheckCircle2 className={`w-3.5 h-3.5 ${i === active ? "" : "text-forest"}`} />}
            <span>{i + 1}. {t.label}</span>
          </button>
        ))}
      </div>

      {mode === "theory" ? (<>
      {img && <img src={img} alt={topic.label} loading="lazy" className="w-full h-auto rounded-2xl border border-border/60 shadow-card-soft" />}

      {topic.sectionIdx.map((si) => sections[si]).filter(Boolean).map((s: any) => (
        <div key={s.title} className="space-y-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-5 pb-5"><h3 className="font-display font-bold text-lg text-foreground">{s.title}</h3></CardContent>
          </Card>
          {s.explanation && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Objašnjenje</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed whitespace-pre-line">{s.explanation}</p></CardContent>
            </Card>
          )}
          {s.table && (
            <Card className="border-accent/20">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span className="text-accent">📐</span> Gramatički obrazac</CardTitle></CardHeader>
              <CardContent><Table rows={s.table} /></CardContent>
            </Card>
          )}
          {s.rules && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Pravila</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2">{s.rules.map((r: string) => <li key={r} className="text-sm flex items-start gap-2"><span className="text-accent mt-0.5">•</span><span>{r}</span></li>)}</ul></CardContent>
            </Card>
          )}
          {s.compare && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>⚖️</span> Poređenje sa srpskim</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{s.compare}</p></CardContent>
            </Card>
          )}
          {s.examples && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>📝</span> Primeri</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {s.examples.map((e: string[]) => (
                  <div key={e[0]} className="p-3 rounded-lg bg-muted flex items-start gap-2">
                    <button type="button" onClick={() => speakLines([{ speaker: "m", text: e[0] }], lang)} className="text-primary/60 hover:text-primary mt-0.5" aria-label={`Izgovori ${e[0]}`}><Volume2 className="w-4 h-4" /></button>
                    <div className="space-y-0.5"><p className="text-sm font-medium">{e[0]}</p><p className="text-xs text-muted-foreground">{e[1]}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {s.mistakes && (
            <Card className="bg-destructive/5 border-destructive/10">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Česte greške</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {s.mistakes.map((m: string[], i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-background/70 border border-destructive/10 space-y-1">
                    <div className="flex flex-wrap gap-2 text-sm"><span className="text-destructive line-through">{m[0]}</span><span className="text-accent">→ {m[1]}</span></div>
                    {m[2] && <p className="text-xs text-muted-foreground">{m[2]}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {s.remember && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="pt-5 pb-5"><p className="text-sm font-medium">📌 <strong>Zapamti:</strong> {s.remember}</p></CardContent>
            </Card>
          )}
        </div>
      ))}

      {onPractice && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm flex-1">Spremna/spreman? Pređi na vežbe za ovu temu i osvoji XP.</p>
          <Button variant="hero" size="sm" onClick={() => onPractice(active)}>
            Provežbaj ovu temu <ArrowRight className="w-4 h-4" />
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

      </>) : (<>
      {topicEx.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-xl text-primary">Pripremljene vežbe ({topicEx.filter((e) => done.includes(e.code)).length}/{topicEx.length})</h3>
          <div className="flex flex-wrap gap-2">
            {topicEx.map((ex, i) => {
              const d = done.includes(ex.code), cur = i === exIdx;
              return (
                <button key={ex.id} type="button" onClick={() => setExIdx(i)} aria-label={`Vežba ${i + 1}`}
                  className={`w-10 h-10 rounded-full text-sm font-semibold border-2 flex items-center justify-center transition-all ${cur ? "bg-primary text-primary-foreground border-primary scale-110 shadow-card-soft" : d ? "bg-forest/15 border-forest text-forest" : "bg-cream/90 border-border text-foreground hover:border-primary/50"}`}>
                  {d && !cur ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
              );
            })}
          </div>
          {topicEx[exIdx] && (
            <LessonExercise key={topicEx[exIdx].id} exercise={topicEx[exIdx]} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={done.includes(topicEx[exIdx].code)} onDone={markDone} />
          )}
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" disabled={exIdx === 0} onClick={() => setExIdx(exIdx - 1)}>← Prethodna</Button>
            {exIdx < topicEx.length - 1 && (
              <Button variant="hero" size="sm" onClick={() => setExIdx(exIdx + 1)}>Sledeća vežba <ArrowRight className="w-4 h-4" /></Button>
            )}
          </div>
          {topicEx.every((e) => done.includes(e.code)) && (
            <p className="text-sm rounded-xl bg-forest/10 border border-forest/30 p-3">🎉 Bravo! Završila/o si sve vežbe ove teme.</p>
          )}
        </div>
      )}

      {renderMore && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          {!showMore ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm flex-1">Želiš još? AI pravi nove slične vežbe za ovu oblast i tvoj nivo.</p>
              <Button variant="hero" size="sm" onClick={() => setShowMore(true)}><Sparkles className="w-4 h-4" /> Provežbaj još</Button>
            </div>
          ) : renderMore(topic.aiTopic)}
        </div>
      )}
      </>)}

      {active < topics.length - 1 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => { setActive(active + 1); onTopicChange?.(active + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Sledeća tema: {topics[active + 1].label} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
