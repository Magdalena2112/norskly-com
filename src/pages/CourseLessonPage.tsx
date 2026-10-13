import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import DialoguePlayer from "@/components/lesson/DialoguePlayer";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, MessageSquare, CheckCircle2 } from "lucide-react";
import { LESSON_TABS, allExercises, loadLessonContent, speakLines, type Exercise, type LessonContent } from "@/lib/courseLessons";

type Lang = "no" | "en" | "de";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-xl text-primary">{title}</h3>
      {children}
    </section>
  );
}

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

const Say = ({ text, lang }: { text: string; lang: string }) => (
  <button type="button" onClick={() => speakLines([{ speaker: "m", text }], lang)} className="inline-flex text-primary/60 hover:text-primary" aria-label={`Izgovori ${text}`}>
    <Volume2 className="w-4 h-4" />
  </button>
);

export default function CourseLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [tab, setTab] = useState("intro");
  const [done, setDone] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
      if (!data) { setNotFound(true); return; }
      setRow(data);
      setContent(await loadLessonContent(data as any));
      if (user) {
        const { data: p } = await supabase.from("course_lesson_progress").select("completed_steps").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle();
        if (p && Array.isArray(p.completed_steps)) setDone(p.completed_steps as string[]);
      }
    })();
  }, [lessonId, user]);

  const exercises = useMemo(() => (content ? allExercises(content) : []), [content]);
  const lang = (row?.language || "en") as Lang;
  const level = row?.cefr_level || profile.level || "A1";

  async function markDone(code: string) {
    if (!user || !row || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    const complete = exercises.every((e) => next.includes(e.code));
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next,
      status: complete ? "completed" : "in_progress", completed_at: complete ? new Date().toISOString() : null,
    }, { onConflict: "user_id,lesson_id" });
  }

  const renderExercises = (list?: Exercise[]) =>
    (list || []).map((ex) => (
      <LessonExercise key={ex.id} exercise={ex} language={lang} level={level} lessonTitle={row.title_target || row.title} done={done.includes(ex.code)} onDone={markDone} />
    ));

  if (notFound) return <StudentLayout><div className="container py-16 text-center text-muted-foreground">Lekcija nije pronađena.</div></StudentLayout>;
  if (!row || !content) return <StudentLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></StudentLayout>;

  const m = content.modules;
  const tabs = LESSON_TABS.filter((t) => t.key === "intro" ? content.intro.length : m[t.key]);
  const modDone = (key: string) => { const ex: Exercise[] = m[key]?.exercises || []; return ex.length > 0 && ex.every((e) => done.includes(e.code)); };
  const textById = (id: string) => content.intro.find((t) => t.id === id);

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-6 sm:py-8 relative z-10">
        <BackButton />
        <header className="mt-3 mb-5 rounded-3xl border border-border/50 bg-cream/90 backdrop-blur-md shadow-postcard p-5 sm:p-7">
          <p className="font-script italic text-primary/60 text-sm">Lekcija {row.sort_order} · {row.cefr_level}</p>
          <h1 className="text-display text-2xl sm:text-3xl text-primary leading-tight">{row.title_target}</h1>
          <p className="text-sm text-muted-foreground mt-1">{row.title} — {row.summary}</p>
          {Array.isArray(row.goals) && row.goals.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">{row.goals.map((g: string) => <li key={g} className="text-xs bg-secondary/60 text-primary px-2.5 py-1 rounded-full">{g}</li>)}</ul>
          )}
          <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-forest transition-all" style={{ width: `${exercises.length ? (done.filter((d) => exercises.some((e) => e.code === d)).length / exercises.length) * 100 : 0}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Urađeno {done.length} / {exercises.length} vežbi</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border flex items-center gap-1 ${tab === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-cream/90 border-border hover:border-primary/40"}`}>
              {t.label}{modDone(t.key) && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {tab === "intro" && (
            <>
              {content.intro.map((t) => <DialoguePlayer key={t.id} title={t.title} scene={t.scene} lines={t.lines} language={lang} />)}
              {renderExercises(m.intro?.exercises)}
            </>
          )}

          {tab === "grammar" && m.grammar && (
            <>
              {m.grammar.sections?.map((s: any) => (
                <div key={s.title} className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-3">
                  <h3 className="font-display font-semibold text-lg text-primary">{s.title}</h3>
                  <p className="text-sm leading-relaxed">{s.explanation}</p>
                  {s.table && <Table rows={s.table} />}
                  {s.rules && <ul className="list-disc pl-5 text-sm space-y-1">{s.rules.map((r: string) => <li key={r}>{r}</li>)}</ul>}
                  {s.compare && <p className="text-sm bg-secondary/40 rounded-lg p-3"><strong>Poređenje sa srpskim:</strong> {s.compare}</p>}
                  {s.examples && <Table head={["English", "Srpski"]} rows={s.examples} />}
                  {s.mistakes && <Table head={["Pogrešno", "Ispravno", "Zašto"]} rows={s.mistakes} />}
                  {s.remember && <p className="text-sm font-medium text-primary">📌 {s.remember}</p>}
                </div>
              ))}
              <Section title="Vežbe">{renderExercises(m.grammar.exercises)}</Section>
            </>
          )}

          {tab === "vocabulary" && m.vocabulary && (
            <>
              {Object.entries(m.vocabulary.collections || { _: "Reči" }).map(([key, name]) => {
                const words = (m.vocabulary.words || []).filter((w: any) => key === "_" || w.collection === key);
                if (!words.length) return null;
                return (
                  <div key={key} className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft">
                    <h3 className="font-display font-semibold text-primary mb-3">{String(name)}</h3>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {words.map((w: any) => (
                        <li key={w.word} className="flex items-start gap-2 rounded-lg bg-background/70 px-3 py-2">
                          <Say text={w.word.split(" / ")[0]} lang={lang} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{w.word} <span className="font-normal text-muted-foreground">— {w.translation}</span></p>
                            {w.example && <p className="text-xs italic text-primary/70">{w.example}</p>}
                            {w.active === false && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">receptivno</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              <Section title="Vežbe">{renderExercises(m.vocabulary.exercises)}</Section>
            </>
          )}

          {tab === "reading" && m.reading && (
            <>
              {m.reading.texts?.map((t: any) => (
                <div key={t.id} className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display font-semibold text-lg text-primary">{t.title}</h3>
                    <Button size="sm" variant="outline" onClick={() => speakLines([{ speaker: "n", text: t.body }], lang)}><Volume2 className="w-4 h-4" /> Slušaj</Button>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">{t.body}</p>
                  {t.note && <p className="text-xs text-muted-foreground mt-2">{t.note}</p>}
                </div>
              ))}
              <Section title="Vežbe">{renderExercises(m.reading.exercises)}</Section>
            </>
          )}

          {tab === "listening" && m.listening && (
            <>
              <p className="text-sm text-muted-foreground">Prvo slušaj bez čitanja. Transkript se otvara posle slušanja ili na zahtev.</p>
              {m.listening.audios?.map((a: any) => {
                const lines = a.lines || textById(a.source)?.lines || [];
                return <DialoguePlayer key={a.id} title={a.title} lines={lines} language={lang} hideTranscript />;
              })}
              <Section title="Vežbe">{renderExercises(m.listening.exercises)}</Section>
            </>
          )}

          {tab === "writing" && m.writing && <Section title="Zadaci za pisanje">{renderExercises(m.writing.exercises)}</Section>}

          {tab === "pronunciation" && m.pronunciation && (
            <>
              {m.pronunciation.alphabet && (
                <div className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft space-y-3">
                  <h3 className="font-display font-semibold text-primary">Alfabet</h3>
                  <Table head={["Slova", "Naziv"]} rows={m.pronunciation.alphabet} />
                  <p className="text-sm text-muted-foreground">{m.pronunciation.note}</p>
                </div>
              )}
              {m.pronunciation.drills?.map((d: any) => (
                <div key={d.code} className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft">
                  <span className="text-[11px] font-mono text-primary/50">{d.code}</span>
                  <h4 className="font-display font-semibold text-primary mb-2">{d.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">Poslušaj model, pa ponovi naglas.</p>
                  <div className="flex flex-wrap gap-2">
                    {d.targets.map((t: string) => (
                      <button key={t} onClick={() => speakLines([{ speaker: "m", text: t }], lang, { slow: true })} className="px-3 py-1.5 rounded-full border border-border bg-background text-sm flex items-center gap-1.5 hover:border-primary/50">
                        <Volume2 className="w-3.5 h-3.5" /> {t}
                      </button>
                    ))}
                  </div>
                  {d.extra && <p className="text-xs text-primary/70 mt-2">{d.extra}</p>}
                </div>
              ))}
              <Button variant="hero" onClick={() => navigate("/pronunciation")}><Mic className="w-4 h-4" /> Snimi se i dobij ocenu izgovora</Button>
            </>
          )}

          {tab === "speaking" && m.speaking && (
            <>
              {m.speaking.tasks?.map((t: any) => (
                <div key={t.code} className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft">
                  <span className="text-[11px] font-mono text-primary/50">{t.code}</span>
                  <h4 className="font-display font-semibold text-primary mb-2">{t.title}</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">{t.prompts.map((p: string) => <li key={p}>{p}</li>)}</ul>
                  {t.roleswitch && m.speaking.roleswitch && (
                    <div className="mt-3 text-sm bg-secondary/40 rounded-lg p-3 space-y-1">
                      <p>{m.speaking.roleswitch.situation}</p>
                      <p className="italic text-primary">Sophie: „{m.speaking.roleswitch.opening}“</p>
                      <p className="text-xs text-muted-foreground">{m.speaking.roleswitch.rubric}</p>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-sm text-muted-foreground">Dozvoljene su razumljive varijante odgovora. Razgovor možeš vežbati glasovnim porukama sa AI sagovornikom.</p>
              <Button variant="hero" onClick={() => navigate("/talk")}><MessageSquare className="w-4 h-4" /> Vežbaj razgovor</Button>
            </>
          )}

          {tab === "culture" && m.culture && (
            <>
              <div className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-lg text-primary">{m.culture.title}</h3>
                  <Button size="sm" variant="outline" onClick={() => speakLines([{ speaker: "n", text: m.culture.body }], lang)}><Volume2 className="w-4 h-4" /> Slušaj</Button>
                </div>
                <p className="leading-relaxed whitespace-pre-line">{m.culture.body}</p>
                {m.culture.note && <p className="text-sm text-muted-foreground mt-3">{m.culture.note}</p>}
              </div>
              <Section title="Aktivnosti">{renderExercises(m.culture.exercises)}</Section>
            </>
          )}

          {tab === "review" && m.review && <Section title="Završna provera">{renderExercises(m.review.exercises)}</Section>}
        </div>
      </div>
    </StudentLayout>
  );
}
