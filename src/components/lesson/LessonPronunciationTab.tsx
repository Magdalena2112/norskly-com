import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Mic, RotateCcw, Volume2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { speakLines } from "@/lib/courseLessons";
import { logActivity } from "@/lib/logActivity";
import { RecordSlot } from "@/pages/PronunciationActivityPage";

type Letter = { letter: string; ipa: string; word: string; meaning: string };
type Opt = string | { label: string; say?: string };
type Item = { prompt?: string; say?: string; sayB?: string; hint?: string; options?: Opt[]; answer?: string; answers?: string[]; repeat?: string; stressNote?: string; reveal?: string; explain?: string; focus?: string; sentences?: string[]; showText?: boolean };
type PEx = {
  code: string; title: string; instruction: string; type: "choose" | "record" | "stress"; noAudio?: boolean; items: Item[];
  /** XP for finishing the exercise (default 10). */ xp?: number;
  /** Objective: done only when every item is answered correctly; wrong answers can be retried. */ requireCorrect?: boolean;
  /** Recording without automatic score: learner compares with the model. */ compareOnly?: boolean;
  checklist?: string[]; maxMs?: number; shuffle?: boolean; optionAudio?: "after"; okMsg?: string; wrongMsg?: string; tip?: string;
};
type TheoryExample = { word?: string; sentence: string; say?: string; display?: string; meaning?: string; stressed?: string[] };
type TheoryGroup = { label: string; rule: string; examples?: TheoryExample[] };
type TheoryPair = { full: string; short: string; fullNote?: string; shortNote?: string };
type Theory = { title: string; text?: string; compare?: string; groups?: TheoryGroup[]; examples?: TheoryExample[]; pairs?: TheoryPair[]; pairHeads?: [string, string]; note?: string };

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; };

const say = (text: string, lang: string, slow = false) => speakLines([{ speaker: "n", text }], lang, { slow });
const optLabel = (o: Opt) => (typeof o === "string" ? o : o.label);

/** Sentence with stressed words visually emphasised. */
function Stressed({ text, stressed }: { text: string; stressed?: string[] }) {
  const clean = (s: string) => s.toLowerCase().replace(/[^\p{L}'’]/gu, "");
  const words = text.split(/\s+/);
  const marks = new Array(words.length).fill(false);
  if (stressed?.length) {
    const lw = words.map(clean);
    for (const ph of stressed) {
      const pw = ph.split(/\s+/).map(clean);
      for (let i = 0; i <= lw.length - pw.length; i++) {
        if (pw.every((w, j) => lw[i + j] === w)) for (let j = 0; j < pw.length; j++) marks[i + j] = true;
      }
    }
  }
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className={marks[i] ? "font-semibold text-primary underline decoration-sunset decoration-2 underline-offset-4" : ""}>
          {w}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function LessonPronunciationTab({ data, lang, level, lessonCode }: {
  data: any; lang: "no" | "en" | "de"; level: string; lessonCode: string;
}) {
  const { user } = useAuth();
  const [view, setView] = useState<"material" | "practice">("material");
  const letters: Letter[] = data.letters || [];
  const theory: Theory[] = data.theory || [];
  const exercises: PEx[] = data.exercises || [];
  const storeKey = `lesson_pron_done_${lessonCode}_${lang}`;
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(storeKey) || "[]"); } catch { return []; } });
  const [idx, setIdx] = useState(0);
  const [item, setItem] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});

  const ex = exercises[idx];
  const finishEx = (code: string) => {
    if (done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
    if (user) void logActivity(user.id, "pronunciation", "lesson_pronunciation", exercises.find((e) => e.code === code)?.xp ?? 10, { lesson: lessonCode, exercise: code },
      { dedupKey: `lesson_pron_${lessonCode}_${code}_${lang}`, language: lang });
  };
  const key = (i: number) => `${ex?.code}_${i}`;
  const itemDone = (i: number) => ex.type === "choose"
    ? (ex.requireCorrect ? picked[key(i)] === ex.items[i].answer : picked[key(i)] !== undefined)
    : !!ok[key(i)];
  const exComplete = ex && (ex.items || []).every((_, i) => itemDone(i));
  const order = useMemo(() => {
    const m: Record<string, Opt[]> = {};
    exercises.forEach((e) => e.shuffle && e.items.forEach((it, i) => {
      m[`${e.code}_${i}`] = [...(it.options || [])].sort((a, b) => hash(e.code + i + optLabel(a)) - hash(e.code + i + optLabel(b)));
    }));
    return m;
  }, [exercises]);
  if (ex && exComplete && !done.includes(ex.code)) setTimeout(() => finishEx(ex.code), 0);

  const card = "rounded-3xl border border-border/50 bg-cream/90 shadow-postcard p-5";

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["material", "practice"] as const).map((v) => (
          <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>
            {v === "material" ? "Gradivo" : "Vežbe"}
          </Button>
        ))}
      </div>

      {view === "material" && (
        <>
          {theory.map((t, ti) => (
            <div key={ti} className={card + " space-y-3"}>
              <div>
                <span className="text-[11px] font-mono text-primary/50">{String.fromCharCode(65 + ti)}</span>
                <h3 className="text-display text-xl text-primary">{t.title}</h3>
                {t.text && <p className="text-sm leading-relaxed mt-2">{t.text}</p>}
              </div>
              {t.groups?.map((g) => (
                <div key={g.label} className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="font-mono font-semibold text-primary">{g.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{g.rule}</p>
                  <div className="grid sm:grid-cols-3 gap-2 mt-3">
                    {g.examples?.map((e) => (
                      <button key={e.sentence} onClick={() => say(e.sentence, lang)}
                        className="rounded-xl border border-border bg-background p-3 text-left hover:border-primary/50 transition">
                        <p className="font-semibold text-primary flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> {e.word}</p>
                        <p className="text-sm mt-0.5">{e.sentence}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {t.examples && (
                <div className="space-y-2">
                  {t.examples.map((e) => (
                    <button key={(e.say || e.sentence) + (e.display || "")} onClick={() => say(e.say || e.sentence, lang)}
                      className="w-full rounded-xl border border-border bg-background p-3 text-left hover:border-primary/50 transition flex items-center justify-between gap-3">
                      <span>
                        <span className="block text-sm sm:text-base">{e.display ? <span className="font-semibold text-primary">{e.display}</span> : <Stressed text={e.sentence} stressed={e.stressed} />}</span>
                        {e.meaning && <span className="block text-xs text-muted-foreground mt-0.5">{e.meaning}</span>}
                      </span>
                      <Volume2 className="w-4 h-4 text-primary/60 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {t.pairs && (
                <div className="space-y-2">
                  {t.pairHeads && (
                    <div className="grid grid-cols-2 gap-2 px-3 text-xs font-medium text-muted-foreground">
                      <span>{t.pairHeads[0]}</span><span>{t.pairHeads[1]}</span>
                    </div>
                  )}
                  {t.pairs.map((p) => t.pairHeads ? (
                    <div key={p.full} className="grid grid-cols-2 gap-2">
                      {([[p.full, p.fullNote], [p.short, p.shortNote]] as const).map(([w, n]) => (
                        <button key={w} onClick={() => say(w, lang)} className="rounded-xl border border-border bg-background p-3 text-left hover:border-primary/50 transition">
                          <span className="font-semibold text-primary inline-flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> {w}</span>
                          {n && <span className="block text-xs text-muted-foreground">{n}</span>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div key={p.full} className="rounded-xl border border-border bg-background p-3 flex flex-wrap items-center gap-2">
                      <button onClick={() => say(p.full, lang)} className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/50">{p.full}</button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <button onClick={() => say(p.short, lang)} className="px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 text-sm font-medium text-primary hover:border-primary">{p.short}</button>
                    </div>
                  ))}
                </div>
              )}
              {t.compare && (
                <p className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-3">
                  <span className="font-medium text-foreground">Poređenje sa srpskim: </span>{t.compare}
                </p>
              )}
              {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
            </div>
          ))}

          {letters.length > 0 && (
            <div className={card}>
              <h3 className="text-display text-xl text-primary">Alfabet A–Z</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Klikni na slovo da čuješ naziv slova i primer reči.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {letters.map((l) => (
                  <button key={l.letter} onClick={() => speakLines([{ speaker: "n", text: l.letter }, { speaker: "n", text: l.word }], lang)}
                    className="text-left rounded-2xl border border-border bg-background p-3 hover:border-primary/50 transition">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-2xl text-primary">{l.letter}</span>
                      <span className="text-xs font-mono text-muted-foreground">{l.ipa}</span>
                    </div>
                    <p className="text-sm mt-1 flex items-center gap-1"><Volume2 className="w-3.5 h-3.5 text-primary/60" /> {l.word} <span className="text-muted-foreground">({l.meaning})</span></p>
                  </button>
                ))}
              </div>
              {data.note && <p className="text-xs text-muted-foreground mt-4">{data.note}</p>}
            </div>
          )}

          {data.spelling?.examples?.length > 0 && (
            <div className={card}>
              <h3 className="text-display text-xl text-primary">{data.spelling.title}</h3>
              <p className="text-sm leading-relaxed mt-2">{data.spelling.text}</p>
              <div className="grid sm:grid-cols-3 gap-2 mt-4">
                {data.spelling.examples.map((e: any) => (
                  <button key={e.word} onClick={() => say(e.spelled.replace(/ – /g, ", "), lang)}
                    className="rounded-2xl border border-border bg-background p-3 text-left hover:border-primary/50">
                    <p className="font-semibold text-primary flex items-center gap-1"><Volume2 className="w-4 h-4" /> {e.word}</p>
                    <p className="text-sm font-mono text-muted-foreground">{e.spelled}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button variant="hero" onClick={() => setView("practice")}><Mic className="w-4 h-4" /> Provežbaj</Button>
        </>
      )}

      {view === "practice" && ex && (
        <>
          <div className={card}>
            <h2 className="text-display text-xl text-primary">Vežbe izgovora</h2>
            <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
              {exercises.map((e, i) => (
                <button key={e.code} onClick={() => { setIdx(i); setItem(0); }}
                  className={`shrink-0 w-9 h-9 rounded-full text-sm font-medium border transition flex items-center justify-center ${i === idx ? "bg-primary text-primary-foreground border-primary" : done.includes(e.code) ? "bg-accent/30 text-primary border-accent" : "bg-background text-muted-foreground border-border"}`}>
                  {done.includes(e.code) && i !== idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className={card + " space-y-4"}>
            <div>
              <span className="text-[11px] font-mono text-primary/50">{ex.code}</span>
              <h3 className="font-display font-semibold text-lg text-primary">{ex.title}</h3>
              <p className="text-sm text-muted-foreground">{ex.instruction}</p>
            </div>
            <div className="flex gap-1.5">
              {(ex.items || []).map((_, i) => (
                <button key={i} onClick={() => setItem(i)}
                  className={`w-7 h-7 rounded-full text-xs border ${i === item ? "bg-primary text-primary-foreground border-primary" : itemDone(i) ? "bg-accent/30 border-accent" : "bg-background border-border"}`}>{i + 1}</button>
              ))}
            </div>
            {(() => {
              const it = ex.items[item]; const k = key(item); const p = picked[k];
              const sel = multi[k] || [];
              const stressOk = ex.type === "stress" ? ok[k] : undefined;
              const audioText = ex.type === "record" && it.hint ? it.hint : (it.say || "");
              const repeatText = it.repeat || it.say || "";
              return (
                <div key={k} className="space-y-3">
                  {it.prompt && <p className="font-medium">{it.prompt}</p>}
                  {ex.type === "record" && it.hint && it.hint !== it.say && <p className="text-sm text-muted-foreground">„{it.hint}“</p>}
                  {ex.type === "stress" && it.say && (
                    <p className="font-display text-lg sm:text-xl text-primary text-center py-2">{it.say}</p>
                  )}
                  {it.showText && <p className="text-base leading-relaxed rounded-2xl bg-background/60 border border-border/60 p-4">{it.say}</p>}
                  {ex.type === "record" && it.focus && <p className="text-sm text-muted-foreground">„<Stressed text={it.say || ""} stressed={[it.focus]} />“</p>}
                  {!ex.noAudio && audioText && it.sayB ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => say(audioText, lang)}><Volume2 className="w-4 h-4" /> Audio A</Button>
                      <Button size="sm" variant="outline" onClick={() => say(it.sayB!, lang)}><Volume2 className="w-4 h-4" /> Audio B</Button>
                      <Button size="sm" variant="ghost" onClick={() => speakLines([{ speaker: "n", text: audioText }, { speaker: "n", text: it.sayB! }], lang, { slow: true })}>Sporije oba</Button>
                    </div>
                  ) : !ex.noAudio && audioText && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => say(audioText, lang)}><Volume2 className="w-4 h-4" /> {it.sentences ? "Ceo tekst" : "Poslušaj"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => say(audioText, lang, true)}>Sporije</Button>
                    </div>
                  )}
                  {it.sentences && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Rečenicu po rečenicu:</p>
                      {it.sentences.map((s2) => (
                        <button key={s2} onClick={() => say(s2, lang)} className="w-full text-left text-sm rounded-xl border border-border bg-background px-3 py-2 hover:border-primary/50 flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-primary/60 shrink-0" /> {s2}
                        </button>
                      ))}
                    </div>
                  )}
                  {(ex.type === "choose" || ex.type === "stress") && it.options && (
                    <div className="flex flex-wrap gap-2">
                      {(order[k] || it.options).map((o) => {
                        const label = optLabel(o);
                        const oSay = typeof o === "object" ? o.say : undefined;
                        if (ex.type === "stress") {
                          const isSel = sel.includes(label);
                          const reveal = stressOk === true && it.answers?.includes(label);
                          return (
                            <button key={label} disabled={stressOk === true}
                              onClick={() => setMulti({ ...multi, [k]: isSel ? sel.filter((s) => s !== label) : [...sel, label].slice(-2) })}
                              className={`px-4 py-2 rounded-full border text-sm transition ${reveal ? "border-emerald-500 bg-emerald-500/10 font-medium text-emerald-700" : isSel ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                              {label}
                            </button>
                          );
                        }
                        const state = p === undefined ? "" : label === p && label === it.answer ? "border-emerald-500 bg-emerald-500/10" : label === p ? "border-destructive bg-destructive/10" : "opacity-60";
                        return (
                          <span key={label} className={`px-4 py-2 rounded-full border border-border bg-background text-sm inline-flex items-center gap-2 ${state}`}>
                            {oSay && (ex.optionAudio === "after" ? p !== undefined : p === undefined) && (
                              <button onClick={(e) => { e.stopPropagation(); say(oSay, lang); }} aria-label={`Poslušaj ${label}`} className="text-primary/70 hover:text-primary">
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button disabled={p !== undefined} onClick={() => setPicked({ ...picked, [k]: label })}>{label}</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {ex.type === "stress" && sel.length === 2 && stressOk === undefined && (
                    <Button size="sm" onClick={() => {
                      const correct = (it.answers || []).slice().sort().join("|") === sel.slice().sort().join("|");
                      setOk({ ...ok, [k]: correct });
                    }}>Proveri</Button>
                  )}
                  {ex.type === "stress" && stressOk !== undefined && (
                    <p className={`text-sm flex items-center gap-1 ${stressOk ? "text-emerald-700" : "text-destructive"}`}>
                      {stressOk ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {stressOk ? "Tačno!" : "Netačno — poslušaj rečenicu ponovo i probaj drugačije."}
                    </p>
                  )}
                  {ex.type === "stress" && stressOk === false && (
                    <Button size="sm" variant="outline" onClick={() => { const n = { ...ok }; delete n[k]; setOk(n); setMulti({ ...multi, [k]: [] }); }}>
                      <RotateCcw className="w-4 h-4" /> Pokušaj ponovo
                    </Button>
                  )}
                  {ex.type === "choose" && p !== undefined && (
                    <p className={`text-sm flex items-center gap-1 ${p === it.answer ? "text-emerald-700" : "text-destructive"}`}>
                      {p === it.answer ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {p === it.answer ? (ex.okMsg || "Tačno!") : (ex.wrongMsg || "Netačno")}
                    </p>
                  )}
                  {ex.type === "choose" && p === it.answer && (it.reveal || it.explain) && (
                    <div className="text-sm rounded-xl bg-secondary/40 p-3 space-y-1">
                      {it.reveal && <p className="font-display text-lg text-primary">{it.reveal}</p>}
                      {it.explain && <p className="text-muted-foreground">{it.explain}</p>}
                    </div>
                  )}
                  {ex.type === "choose" && ex.requireCorrect && p !== undefined && p !== it.answer && (
                    <Button size="sm" variant="outline" onClick={() => { const n = { ...picked }; delete n[k]; setPicked(n); }}>
                      <RotateCcw className="w-4 h-4" /> Pokušaj ponovo
                    </Button>
                  )}
                  {(ex.type === "record" || (ex.type === "choose" && p !== undefined && (!ex.requireCorrect || p === it.answer) && repeatText) || (ex.type === "stress" && stressOk === true)) && (
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                      <RecordSlot item={{ text: ex.type === "record" ? (it.say || it.hint || "") : repeatText }} lang={lang} level={level} compareOnly={false} maxMs={Math.min(ex.maxMs ?? 15000, 30000)} checklist={ex.checklist} onSuccess={() => setOk((o) => ({ ...o, [k]: true }))} />
                      {ex.tip && ok[k] && <p className="text-sm text-primary/80 mt-2">{ex.tip}</p>}
                    </div>
                  )}
                  {ex.type === "record" && it.stressNote && ok[k] && (
                    <p className="text-sm text-primary/80">Naglašeno: <span className="font-semibold">{it.stressNote}</span></p>
                  )}
                  <div className="flex justify-between">
                    <Button size="sm" variant="outline" disabled={item === 0} onClick={() => setItem(item - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    {item < ex.items.length - 1
                      ? <Button size="sm" onClick={() => setItem(item + 1)}>Sledeće <ChevronRight className="w-4 h-4" /></Button>
                      : idx < exercises.length - 1 && <Button size="sm" onClick={() => { setIdx(idx + 1); setItem(0); }}>Sledeća vežba <ChevronRight className="w-4 h-4" /></Button>}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
