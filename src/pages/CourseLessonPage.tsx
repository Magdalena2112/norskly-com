import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import DialoguePlayer from "@/components/lesson/DialoguePlayer";
import LessonListeningTab from "@/components/lesson/LessonListeningTab";
import LessonPronunciationTab from "@/components/lesson/LessonPronunciationTab";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, MessageSquare, CheckCircle2, ChevronLeft, ChevronRight, BookOpen, Languages, BookOpenText, Headphones, PenLine, Globe2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import PostcardVignette from "@/components/student/PostcardVignette";
import { LESSON_IMAGES } from "@/content/lessons/images";

const MODULE_META: Record<string, { title: string; subtitle: string; description: string; icon: typeof BookOpen; iconBg: string; vignette: any }> = {
  grammar: { title: "Gramatika", subtitle: "Grammar", description: "Objašnjenja, tabele, česte greške i vežbe sa 3 pokušaja.", icon: BookOpen, iconBg: "bg-primary", vignette: "book" },
  vocabulary: { title: "Vokabular", subtitle: "Vocabulary", description: "Reči lekcije po grupama, sa izgovorom i primerima.", icon: Languages, iconBg: "bg-sunset", vignette: "stamp" },
  reading: { title: "Čitanje", subtitle: "Reading", description: "Tekstovi lekcije i pitanja razumevanja.", icon: BookOpenText, iconBg: "bg-fjord", vignette: "stamp" },
  listening: { title: "Slušanje", subtitle: "Listening", description: "Slušaj situacije bez teksta, pa proveri razumevanje.", icon: Headphones, iconBg: "bg-sunset", vignette: "speech" },
  writing: { title: "Pisanje", subtitle: "Writing", description: "Kratki zadaci pisanja sa AI povratnom informacijom.", icon: PenLine, iconBg: "bg-accent", vignette: "book" },
  pronunciation: { title: "Izgovor", subtitle: "Pronunciation", description: "Alfabet, glasovi i intonacija — slušaj i ponovi.", icon: Mic, iconBg: "bg-primary", vignette: "speech" },
  speaking: { title: "Razgovor", subtitle: "Speaking", description: "Scenariji razgovora i RoleSwitch sa Sophie.", icon: MessageSquare, iconBg: "bg-fjord", vignette: "speech" },
  culture: { title: "Kultura", subtitle: "Culture & Society", description: "Kako se ljudi upoznaju i pozdravljaju.", icon: Globe2, iconBg: "bg-forest", vignette: "cabins" },
  review: { title: "Ponavljanje", subtitle: "Review", description: "Završna provera cele lekcije.", icon: Trophy, iconBg: "bg-sunset", vignette: "cabins" },
};
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
  const [textIdx, setTextIdx] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"learn" | "practice">("learn");
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

  const exercises = useMemo(() => content ? [
    ...allExercises(content),
    ...(content.modules.listening?.scenes || []).map((s: { id: string; code?: string }) => ({ id: s.id, code: s.code || s.id, title: "", instruction: "", kind: "listening", items: [] })),
  ] : [], [content]);
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

  // Steps finished in module pages (grammar, vocabulary, writing) save as "in_progress";
  // mark the lesson completed once every step is present.
  useEffect(() => {
    if (!user || !row || !exercises.length) return;
    if (!exercises.every((e) => done.includes(e.code))) return;
    void supabase.from("course_lesson_progress").update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("user_id", user.id).eq("lesson_id", row.id).neq("status", "completed");
  }, [user, row, exercises, done]);

  const renderExercises = (list?: Exercise[]) =>
    (list || []).map((ex) => (
      <LessonExercise key={ex.id} exercise={ex} language={lang} level={level} lessonTitle={row.title_target || row.title} done={done.includes(ex.code)} onDone={markDone} />
    ));

  if (notFound) return <StudentLayout><div className="container py-16 text-center text-muted-foreground">Lekcija nije pronađena.</div></StudentLayout>;
  if (!row || !content) return <StudentLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></StudentLayout>;

  const m = content.modules;
  const tabs = LESSON_TABS.filter((t) => t.key === "intro" ? content.intro.length : m[t.key]);
  const moduleExercises = (key: string): Exercise[] => key === "listening" && m.listening?.scenes
    ? m.listening.scenes.map((s: { id: string; code?: string }) => ({ id: s.id, code: s.code || s.id, title: "", instruction: "", kind: "listening", items: [] }))
    : m[key]?.exercises || [];
  const modDone = (key: string) => { const ex = moduleExercises(key); return ex.length > 0 && ex.every((e) => done.includes(e.code)); };
  const textById = (id: string) => content.intro.find((t) => t.id === id);
  const imgs = LESSON_IMAGES[row.lesson_code || content.code];
  const moduleKeys = LESSON_TABS.map((t) => t.key).filter((k) => k !== "intro" && m[k] && MODULE_META[k]);
  const hasMaterial = (k: string) => !["writing", "review"].includes(k);
  const openEx: Exercise[] = open ? m[open]?.exercises || [] : [];
  const openModule = (k: string | null) => {
    if (k === "grammar") { navigate(`/grammar?lesson=${row.id}`); return; }
    if (k === "vocabulary") { navigate(`/vocabulary?lesson=${row.id}`); return; }
    if (k === "writing") { navigate(`/writing?lesson=${row.id}`); return; }
    setOpen(k); setView("learn"); requestAnimationFrame(() => document.getElementById("lesson-modules")?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-6 sm:py-8 relative z-10">
        <BackButton />
        <header className="mt-3 mb-6 rounded-3xl border border-border/50 bg-cream/90 backdrop-blur-md shadow-postcard overflow-hidden">
          {imgs?.cover && <img src={imgs.cover} alt={row.title_target} className="w-full aspect-[16/9] object-cover" />}
          <div className="p-5 sm:p-7">
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
          </div>
        </header>

        {/* 1) Intro texts — one at a time, with illustrations */}
        {content.intro.length > 0 && (() => {
          const t = content.intro[Math.min(textIdx, content.intro.length - 1)];
          const img = imgs?.texts[t.id];
          const last = textIdx >= content.intro.length - 1;
          return (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl text-primary">Uvodni tekstovi</h2>
                <span className="text-xs text-muted-foreground">Tekst {textIdx + 1} od {content.intro.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={t.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-3">
                  {img && <img src={img} alt={t.title} loading="lazy" className="w-full rounded-3xl border border-border/50 shadow-postcard object-cover aspect-[4/3] sm:aspect-[16/10]" />}
                  <DialoguePlayer title={t.title} scene={t.scene} lines={t.lines} language={lang} />
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-between gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={textIdx === 0} onClick={() => setTextIdx((i) => i - 1)}><ChevronLeft className="w-4 h-4" /> Prethodni</Button>
                <div className="flex gap-1.5">{content.intro.map((x, i) => <button key={x.id} aria-label={`Tekst ${i + 1}`} onClick={() => setTextIdx(i)} className={`h-2 rounded-full transition-all ${i === textIdx ? "w-6 bg-primary" : "w-2 bg-primary/25"}`} />)}</div>
                {!last ? (
                  <Button variant="hero" size="sm" onClick={() => setTextIdx((i) => i + 1)}>Sledeći tekst <ChevronRight className="w-4 h-4" /></Button>
                ) : (
                  <Button variant="hero" size="sm" onClick={() => document.getElementById("lesson-modules")?.scrollIntoView({ behavior: "smooth" })}>Na module <ChevronRight className="w-4 h-4" /></Button>
                )}
              </div>
              {last && m.intro?.exercises?.length > 0 && <div className="mt-6"><Section title="Provera razumevanja">{renderExercises(m.intro.exercises)}</Section></div>}
            </section>
          );
        })()}

        {/* 2) Module cards */}
        <div id="lesson-modules" className="scroll-mt-20">
        {!open ? (
          <>
            <h2 className="font-display text-xl text-primary mb-4">Moduli lekcije</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {moduleKeys.map((key, i) => {
                const meta = MODULE_META[key];
                const cover = imgs?.modules[key]?.[0];
                const ex = moduleExercises(key);
                const n = ex.filter((e) => done.includes(e.code)).length;
                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="cursor-pointer group h-full bg-cream border border-border/60 shadow-postcard overflow-hidden relative transition-all duration-500 hover:-translate-y-1.5" onClick={() => openModule(key)}>
                      <div className="relative w-full h-36 overflow-hidden border-b border-border/40">
                        {cover ? <img src={cover} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" /> : <PostcardVignette variant={meta.vignette} className="absolute inset-0 w-full h-full" />}
                        <div className={`absolute -bottom-5 left-5 w-12 h-12 rounded-2xl ${meta.iconBg} flex items-center justify-center shadow-card-soft ring-2 ring-cream`}>
                          <meta.icon className="w-5 h-5 text-cream" />
                        </div>
                        {modDone(key) && <span className="absolute top-2 right-2 bg-forest text-cream text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Završeno</span>}
                      </div>
                      <CardContent className="pt-8 pb-5 px-5">
                        <p className="font-script italic text-xs text-primary/55 mb-0.5">{meta.subtitle}</p>
                        <h3 className="font-display font-semibold text-lg text-primary leading-tight">{meta.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{meta.description}</p>
                        {ex.length > 0 && <p className="text-xs text-primary/70 mt-2">Vežbe: {n} / {ex.length}</p>}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => openModule(null)}><ChevronLeft className="w-4 h-4" /> Svi moduli</Button>
              <div className="flex gap-1 overflow-x-auto">{moduleKeys.map((k) => <button key={k} onClick={() => openModule(k)} className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${k === open ? "bg-primary text-primary-foreground border-primary" : "bg-cream/90 border-border"}`}>{MODULE_META[k].title}</button>)}</div>
            </div>
            <div className="rounded-3xl border border-border/50 bg-cream/90 backdrop-blur-md shadow-postcard p-5">
              <p className="font-script italic text-primary/60 text-sm">{MODULE_META[open].subtitle}</p>
              <h2 className="font-display text-2xl text-primary">{MODULE_META[open].title}</h2>
              {hasMaterial(open) && openEx.length > 0 && (
                <div className="mt-4 inline-flex rounded-full bg-secondary/60 p-1">
                  {(["learn", "practice"] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-full text-sm ${view === v ? "bg-primary text-primary-foreground" : "text-primary"}`}>
                      {v === "learn" ? "1 · Gradivo" : `2 · Vežbe (${openEx.filter((e) => done.includes(e.code)).length}/${openEx.length})`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {open !== "listening" && view === "learn" && hasMaterial(open) && (imgs?.modules[open] || []).length > 0 && (
              <div className={`grid gap-3 ${(imgs!.modules[open].length > 1) ? "sm:grid-cols-2" : ""}`}>
                {imgs!.modules[open].map((src, i) => <img key={src + i} src={src} alt={`${MODULE_META[open].title} ilustracija ${i + 1}`} loading="lazy" className={`w-full rounded-2xl border border-border/50 shadow-card-soft object-cover ${imgs!.modules[open].length > 1 && i === 0 ? "sm:col-span-2" : ""}`} />)}
              </div>
            )}
            {view === "practice" || !hasMaterial(open) ? (
              <ExerciseStepper list={openEx} done={done} render={(ex) => renderExercises([ex])} onFinish={() => openModule(null)} />
            ) : (
              <>
                {renderMaterial(open)}
                {openEx.length > 0 && <Button variant="hero" onClick={() => { setView("practice"); window.scrollTo({ top: document.getElementById("lesson-modules")!.offsetTop - 80, behavior: "smooth" }); }}>Pređi na vežbe <ChevronRight className="w-4 h-4" /></Button>}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </StudentLayout>
  );

  function renderMaterial(tab: string) {
    return (
        <div className="space-y-6">
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
            </>
          )}

          {tab === "listening" && m.listening && (
            <>
              {m.listening.scenes ? (
                <LessonListeningTab key={`${row.id}_${lang}`} scenes={m.listening.scenes} lang={lang} lessonCode={content?.code || "lesson"} completed={done} onDone={markDone} onFinish={() => openModule(null)} />
              ) : m.listening.audios?.map((a: any) => {
                const lines = a.lines || textById(a.source)?.lines || [];
                return <DialoguePlayer key={a.id} title={a.title} lines={lines} language={lang} hideTranscript />;
              })}
            </>
          )}


          {tab === "pronunciation" && m.pronunciation && (
            m.pronunciation.exercises
              ? <LessonPronunciationTab key={`${row.id}_${lang}`} data={m.pronunciation} lang={lang} level={level} lessonCode={content?.code || "lesson"} />
              : <Button variant="hero" onClick={() => navigate("/pronunciation")}><Mic className="w-4 h-4" /> Snimi se i dobij ocenu izgovora</Button>
          )}

          {tab === "speaking" && (
            <div className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft space-y-3">
              <h4 className="font-display font-semibold text-primary">Razgovorne situacije lekcije</h4>
              <p className="text-sm text-muted-foreground">AI preuzima ulogu sagovornika, započinje razgovor i vodi te kroz ciljeve lekcije. Posle toga možeš nastaviti slobodan razgovor.</p>
              <Button variant="hero" onClick={() => navigate(`/talk?lesson=${encodeURIComponent(content?.code || "")}`)}><MessageSquare className="w-4 h-4" /> Otvori razgovor</Button>
            </div>
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
            </>
          )}

        </div>
    );
  }
}

function ExerciseStepper({ list, done, render, onFinish }: { list: Exercise[]; done: string[]; render: (e: Exercise) => React.ReactNode; onFinish: () => void }) {
  const [i, setI] = useState(() => Math.max(0, list.findIndex((e) => !done.includes(e.code))));
  if (!list.length) return null;
  const ex = list[Math.min(i, list.length - 1)];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {list.map((e, k) => (
          <button key={e.id} onClick={() => setI(k)} className={`w-8 h-8 rounded-full text-xs font-semibold border ${k === i ? "bg-primary text-primary-foreground border-primary" : done.includes(e.code) ? "bg-forest/15 text-forest border-forest/40" : "bg-cream/90 border-border"}`}>{k + 1}</button>
        ))}
      </div>
      <div key={ex.id}>{render(ex)}</div>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft className="w-4 h-4" /> Prethodna</Button>
        {i < list.length - 1 ? <Button variant="hero" size="sm" onClick={() => setI(i + 1)}>Sledeća <ChevronRight className="w-4 h-4" /></Button> : <Button variant="hero" size="sm" onClick={onFinish}>Završi modul</Button>}
      </div>
    </div>
  );
}
