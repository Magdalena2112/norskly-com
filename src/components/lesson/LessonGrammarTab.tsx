import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import LessonExercise from "@/components/lesson/LessonExercise";
import GrammarPracticeExercise from "@/components/lesson/GrammarPracticeExercise";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, BookOpen, CheckCircle2, Sparkles, ArrowRight, Lightbulb, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadLessonContent, speakLines, type Exercise, type LessonContent } from "@/lib/courseLessons";
import { LESSON_IMAGES } from "@/content/lessons/images";
import { earnedXp, type PracticeExercise } from "@/lib/grammarPractice";
import { logActivity } from "@/lib/logActivity";

const gc = (...n: number[]) => n.map((x) => `G-${String(x).padStart(2, "0")}`);

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

/** One-click micro quiz inside a theory section. */
function QuickCheckCard({ qc }: { qc: { question: string; options: string[]; correct: number; feedback?: string } }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Blic provera</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{qc.question}</p>
        <div className="space-y-2">
          {qc.options.map((o, i) => {
            const chosen = picked === i;
            const ok = picked !== null && i === qc.correct;
            const bad = chosen && i !== qc.correct;
            return (
              <button key={i} type="button" disabled={picked !== null} onClick={() => setPicked(i)}
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors ${ok ? "border-forest bg-forest/10 text-forest" : bad ? "border-destructive bg-destructive/10 text-destructive" : "border-border/60 bg-background hover:border-primary/50"}`}>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className={`text-xs leading-relaxed ${picked === qc.correct ? "text-forest" : "text-muted-foreground"}`}>
            {picked === qc.correct ? "✅ " : "💡 "}{qc.feedback || (picked === qc.correct ? "Tačno!" : "Nije tačno — pogledaj objašnjenje iznad.")}
          </p>
        )}
      </CardContent>
    </Card>
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
  "EN-A2-L01": [
    { label: "Present Simple", sectionIdx: [0, 1], exercises: ["PS-01","PS-02","PS-03","PS-04","PS-05"], aiTopic: "Present Simple – habits, routines, third person -s, do/does, adverbs of frequency",
      related: [{ title: "Prilozi učestalosti", query: "Adverbs of frequency position" }, { title: "Do / does pitanja", query: "Present Simple questions with do and does" }] },
    { label: "Present Continuous", sectionIdx: [2, 3], exercises: ["PC-01","PC-02","PC-03","PC-04","PC-05"], aiTopic: "Present Continuous – actions now, temporary situations, -ing spelling",
      related: [{ title: "Pravopis -ing oblika", query: "Spelling rules for -ing forms" }, { title: "Present Continuous za budućnost", query: "Present Continuous for future arrangements" }] },
    { label: "Simple vs. Continuous", sectionIdx: [4], exercises: Array.from({ length: 20 }, (_, i) => `MIX-${String(i + 1).padStart(2, "0")}`), aiTopic: "Present Simple vs Present Continuous – choosing the tense by meaning and context",
      related: [{ title: "Vremenski izrazi", query: "Time expressions Present Simple vs Present Continuous" }] },
    { label: "Stative verbs", sectionIdx: [5, 6], exercises: ["ST-01","ST-02","ST-03","ST-04","ST-05","ST-06","ST-07","ST-08","ST-09","ST-10"], aiTopic: "Stative verbs (know, like, want, need, understand) and think/have state vs action",
      related: [{ title: "Think i have – dva značenja", query: "Think and have as stative and action verbs" }] },
  ],
  "NO-A2-L01": [
    { label: "V2 i inverzija", sectionIdx: [0, 1], exercises: gc(1, 2, 7, 11, 15, 17, 18, 21, 22, 24, 27), aiTopic: "Norwegian V2 rule and inversion after time expressions", related: [] },
    { label: "Negacija ikke", sectionIdx: [2], exercises: gc(4, 13, 20, 23), aiTopic: "Position of ikke in Norwegian main clauses", related: [] },
    { label: "Pitanja", sectionIdx: [3], exercises: gc(3, 5, 8, 10, 12, 16, 25, 26), aiTopic: "Norwegian yes/no questions and question words", related: [] },
    { label: "Prilozi učestalosti", sectionIdx: [4], exercises: gc(6, 9, 14, 19), aiTopic: "Norwegian adverbs of frequency and their position", related: [] },
    { label: "Kombinovano", sectionIdx: [0, 1, 2, 3, 4], exercises: gc(28, 29, 30), aiTopic: "Norwegian V2, inversion, ikke and questions combined", related: [] },
  ],
  "NO-HC-B1-L01": [
    { label: "Indirekte spørsmål", sectionIdx: [0], exercises: ["GR-01", "GR-02"], aiTopic: "Norwegian indirect questions with question words and om (no inversion)", related: [] },
    { label: "Ikke i leddsetninger", sectionIdx: [1], exercises: ["GR-03"], aiTopic: "Position of ikke and adverbs in Norwegian subordinate clauses", related: [] },
    { label: "Høflige former", sectionIdx: [2], exercises: ["GR-04"], aiTopic: "Polite requests and advice with kunne, ville, skulle, burde in healthcare", related: [] },
  ],
  "DE-HC-B1-L01": [
    { label: "Indirekte Fragen", sectionIdx: [0], exercises: ["GR-01", "GR-02"], aiTopic: "German indirect questions with W-words and ob (verb at the end)", related: [] },
    { label: "Nebensätze", sectionIdx: [1], exercises: ["GR-03"], aiTopic: "German subordinate clauses with weil, dass, wenn (verb final, nicht position)", related: [] },
    { label: "Höflichkeit", sectionIdx: [2], exercises: ["GR-04"], aiTopic: "German Konjunktiv II politeness: könnten, würden, sollten in healthcare", related: [] },
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
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Resume at the first unfinished exercise of the topic.
    const t = (content && row && LESSON_GRAMMAR_TOPICS[row.lesson_code]?.[active]);
    const ex: Exercise[] = content?.modules.grammar?.exercises || [];
    const list = t ? ex.filter((e) => t.exercises.includes(e.code)) : [];
    const first = list.findIndex((e) => !done.includes(e.code));
    setExIdx(first > 0 ? first : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, loaded]);
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
      setLoaded(true);
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
  if (unassigned.length && topics.length && !LESSON_GRAMMAR_TOPICS[row.lesson_code]) topics[topics.length - 1] = { ...topics[topics.length - 1], exercises: [...topics[topics.length - 1].exercises, ...unassigned.map((e) => e.code)] };

  async function markDone(code: string) {
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
    const ex = exercises.find((e) => e.code === code) as any;
    if (ex?.xp) {
      await logActivity(user.id, "grammar", "lesson_grammar_exercise", ex.xp, { lesson_id: row.id, code },
        { dedupKey: `lesson:${row.id}:${code}`, language: row.language });
    }
  }

  if (!topics.length) return <p className="text-sm text-muted-foreground">Gramatički sadržaj ove lekcije je u pripremi.</p>;
  const topic = topics[Math.min(Math.max(active, 0), topics.length - 1)] ?? topics[0];
  const topicEx = topic ? exercises.filter((e) => topic.exercises.includes(e.code)) : [];
  const isTopicDone = (t: Topic) => t.exercises.length > 0 && t.exercises.every((c) => done.includes(c));
  const img = images.length ? images[active % images.length] : undefined;
  const xpExercises = exercises.filter((e: any) => e.xp) as any[];
  const xpTotal = xpExercises.reduce((s, e) => s + e.xp, 0);
  const xpEarned = earnedXp(xpExercises, done);
  const xpDone = xpExercises.filter((e) => done.includes(e.code)).length;

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
          {/* Short, welcoming intro before the practical cards — never a wall of text. */}
          {s.intro && (
            <Card className="border-primary/25 bg-primary/5">
              <CardHeader className="pb-1 pt-4"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-primary" /> O čemu se radi</CardTitle></CardHeader>
              <CardContent className="pt-0 pb-4"><p className="text-sm leading-relaxed">{s.intro}</p></CardContent>
            </Card>
          )}
          {/* Sections with the enriched card format (dialogue, formula, traps…)
              already cover the explanation in visual steps — skip the heavy
              paragraph there so content isn't duplicated. */}
          {s.explanation && !s.dialogue && !s.formula && !s.brainTrap && !s.quickCheck && !s.mnemonic && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Objašnjenje</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed whitespace-pre-line">{s.explanation}</p></CardContent>
            </Card>
          )}
          {s.dialogue && (
            <Card className="border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>💬</span> Scena iz prakse</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {s.dialogue.context && <p className="text-xs text-muted-foreground italic">{s.dialogue.context}</p>}
                <div className="space-y-2">
                  {s.dialogue.lines.map((l: string[], i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted">
                      <button type="button" onClick={() => speakLines([{ speaker: "m", text: l[1] }], lang)} className="text-primary/60 hover:text-primary mt-0.5" aria-label={`Izgovori ${l[1]}`}><Volume2 className="w-4 h-4" /></button>
                      <p className="text-sm"><span className="font-semibold text-primary">{l[0]}:</span> {l[1]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {s.formula && (
            <Card className="border-accent/40 bg-accent/5">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>🧩</span> {s.formula.label}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-mono font-medium rounded-lg bg-background/70 border border-accent/20 px-3 py-2">{s.formula.pattern}</p>
                {s.formula.examples?.map((e: string) => (
                  <div key={e} className="flex items-start gap-2">
                    <button type="button" onClick={() => speakLines([{ speaker: "m", text: e }], lang)} className="text-primary/60 hover:text-primary mt-0.5" aria-label={`Izgovori ${e}`}><Volume2 className="w-4 h-4" /></button>
                    <p className="text-sm">{e}</p>
                  </div>
                ))}
              </CardContent>
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
          {s.brainTrap && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>🧠</span> Zamka za naš mozak</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{s.brainTrap}</p></CardContent>
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
          {s.quickCheck && <QuickCheckCard qc={s.quickCheck} />}
          {s.mnemonic && (
            <Card className="border-forest/30 bg-forest/5">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><span>🪄</span> Štos za pamćenje</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{s.mnemonic}</p></CardContent>
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
          {xpTotal > 0 && (
            <div className="rounded-xl border border-border/60 bg-cream/90 p-3 space-y-2">
              <div className="flex justify-between text-sm font-medium text-primary">
                <span>Urađeno {xpDone}/{xpExercises.length}</span>
                <span>{xpEarned}/{xpTotal} XP</span>
              </div>
              <Progress value={(xpEarned / xpTotal) * 100} className="h-2" />
            </div>
          )}
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
            (topicEx[exIdx] as any).type
              ? <GrammarPracticeExercise key={topicEx[exIdx].id} exercise={topicEx[exIdx] as unknown as PracticeExercise} done={done.includes(topicEx[exIdx].code)} onDone={markDone} />
              : <LessonExercise key={topicEx[exIdx].id} exercise={topicEx[exIdx]} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={done.includes(topicEx[exIdx].code)} onDone={markDone} />
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
