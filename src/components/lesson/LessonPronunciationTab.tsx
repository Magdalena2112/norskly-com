import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Mic, Volume2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { speakLines } from "@/lib/courseLessons";
import { logActivity } from "@/lib/logActivity";
import { RecordSlot } from "@/pages/PronunciationActivityPage";

type Letter = { letter: string; ipa: string; word: string; meaning: string };
type Item = { prompt?: string; say: string; options?: string[]; answer?: string; hint?: string };
type PEx = { code: string; title: string; instruction: string; type: "choose" | "record"; items: Item[] };

const say = (text: string, lang: string, slow = false) => speakLines([{ speaker: "n", text }], lang, { slow });

export default function LessonPronunciationTab({ data, lang, level, lessonCode }: {
  data: any; lang: "no" | "en" | "de"; level: string; lessonCode: string;
}) {
  const { user } = useAuth();
  const [view, setView] = useState<"material" | "practice">("material");
  const letters: Letter[] = data.letters || [];
  const exercises: PEx[] = data.exercises || [];
  const storeKey = `lesson_pron_done_${lessonCode}_${lang}`;
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(storeKey) || "[]"); } catch { return []; } });
  const [idx, setIdx] = useState(0);
  const [item, setItem] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});

  const ex = exercises[idx];
  const finishEx = (code: string) => {
    if (done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
    if (user) void logActivity(user.id, "pronunciation", "lesson_pronunciation", 10, { lesson: lessonCode, exercise: code },
      { dedupKey: `lesson_pron_${lessonCode}_${code}_${lang}`, language: lang });
  };
  const key = (i: number) => `${ex?.code}_${i}`;
  const exComplete = ex && ex.items.every((_, i) => ex.type === "choose" ? picked[key(i)] !== undefined : ok[key(i)]);
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

          {data.spelling && (
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
              {ex.items.map((_, i) => (
                <button key={i} onClick={() => setItem(i)}
                  className={`w-7 h-7 rounded-full text-xs border ${i === item ? "bg-primary text-primary-foreground border-primary" : (ex.type === "choose" ? picked[key(i)] !== undefined : ok[key(i)]) ? "bg-accent/30 border-accent" : "bg-background border-border"}`}>{i + 1}</button>
              ))}
            </div>
            {(() => {
              const it = ex.items[item]; const k = key(item); const p = picked[k];
              return (
                <div key={k} className="space-y-3">
                  {it.prompt && <p className="font-medium">{it.prompt}</p>}
                  {ex.type === "record" && it.hint && <p className="text-sm text-muted-foreground">„{it.hint}“</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => say(ex.type === "record" && it.hint ? it.hint : it.say, lang)}><Volume2 className="w-4 h-4" /> Poslušaj</Button>
                    <Button size="sm" variant="ghost" onClick={() => say(ex.type === "record" && it.hint ? it.hint : it.say, lang, true)}>Sporije</Button>
                  </div>
                  {ex.type === "choose" && (
                    <div className="flex flex-wrap gap-2">
                      {it.options!.map((o) => {
                        const state = p === undefined ? "" : o === it.answer ? "border-emerald-500 bg-emerald-500/10" : o === p ? "border-destructive bg-destructive/10" : "opacity-60";
                        return <button key={o} disabled={p !== undefined} onClick={() => setPicked({ ...picked, [k]: o })}
                          className={`px-4 py-2 rounded-full border border-border bg-background text-sm ${state}`}>{o}</button>;
                      })}
                    </div>
                  )}
                  {ex.type === "choose" && p !== undefined && (
                    <p className={`text-sm flex items-center gap-1 ${p === it.answer ? "text-emerald-700" : "text-destructive"}`}>
                      {p === it.answer ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {p === it.answer ? "Tačno!" : `Tačno je: ${it.answer}`}
                    </p>
                  )}
                  {(ex.type === "record" || p !== undefined) && (
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Snimi se: <span className="font-medium text-foreground">{it.say}</span></p>
                      <RecordSlot item={{ text: it.say }} lang={lang} level={level} onSuccess={() => setOk((o) => ({ ...o, [k]: true }))} />
                    </div>
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
