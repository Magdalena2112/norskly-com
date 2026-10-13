import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { loadLessonContent, speakLines, type Exercise } from "@/lib/courseLessons";
import LessonExercise from "@/components/lesson/LessonExercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, BookOpen, ArrowRight, CheckCircle2, MessageSquareQuote, PenLine } from "lucide-react";
import v1 from "@/assets/lessons/en-a1-l01-vocab-1.webp.asset.json";
import v2 from "@/assets/lessons/en-a1-l01-vocab-2.webp.asset.json";
import v3 from "@/assets/lessons/en-a1-l01-vocab-3.webp.asset.json";
import v4 from "@/assets/lessons/en-a1-l01-vocab-4.webp.asset.json";

const IMAGES: Record<string, string> = { v1: v1.url, v2: v2.url, v3: v3.url, v4: v4.url };

interface Word { word: string; translation: string; example?: string; active?: boolean }
interface Area { key: string; title: string; sr: string; images?: string[]; words: Word[]; examples?: string[]; exercises: string[] }

let sharedIdx = 0;

export default function LessonVocabularyTab({ lessonId, mode, onPractice }: { lessonId: string; mode: "theory" | "practice"; onPractice: () => void }) {
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [idx, setIdxState] = useState(sharedIdx);
  const setIdx = (i: number) => { sharedIdx = i; setIdxState(i); };
  useEffect(() => { setIdxState(sharedIdx); }, [mode]);
  const [exIdx, setExIdx] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
      if (!data) return;
      setRow(data);
      const v = (await loadLessonContent(data as any)).modules?.vocabulary;
      if (!v) return;
      setExercises(v.exercises || []);
      if (Array.isArray(v.areas)) setAreas(v.areas);
      else {
        const cols: Record<string, string> = v.collections || { _: "Reči" };
        setAreas(Object.entries(cols).map(([key, name]) => ({
          key, title: String(name), sr: String(name), exercises: [],
          words: (v.words || []).filter((w: any) => key === "_" || w.collection === key),
        })).filter((a) => a.words.length));
      }
      if (user) {
        const { data: p } = await supabase.from("course_lesson_progress").select("completed_steps").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle();
        if (p && Array.isArray(p.completed_steps)) setDone(p.completed_steps as string[]);
      }
    })();
  }, [lessonId, user]);

  useEffect(() => { setExIdx(0); }, [idx, mode]);

  if (!row || !areas.length) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje reči lekcije…</p>;
  const lang = row.language || "en";
  const a = areas[Math.min(idx, areas.length - 1)];
  const areaEx = exercises.filter((e) => a.exercises.includes(e.code));
  const isAreaDone = (x: Area) => x.exercises.length > 0 && x.exercises.every((c) => done.includes(c));
  const active = a.words.filter((w) => w.active !== false);
  const passive = a.words.filter((w) => w.active === false);
  const say = (t: string) => speakLines([{ speaker: "m", text: t.split(" / ")[0].replace("…", "") }], lang);

  async function markDone(code: string) {
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
  }

  const WordCard = ({ w }: { w: Word }) => (
    <li className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2.5">
      <button onClick={() => say(w.word)} className="text-primary/60 hover:text-primary shrink-0" aria-label={`Izgovori ${w.word}`}>
        <Volume2 className="w-4 h-4" />
      </button>
      <div className="min-w-0 flex-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-semibold text-primary">{w.word}</p>
        <p className="text-sm text-muted-foreground">{w.translation}</p>
        {w.example && <p className="w-full text-xs italic text-primary/70 mt-0.5">„{w.example}“</p>}
      </div>
    </li>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary">
        <BookOpen className="w-4 h-4" />
        <p className="text-sm font-medium">Lekcija {row.sort_order}: {row.title_target}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {areas.map((x, i) => (
          <button key={x.key} type="button" onClick={() => setIdx(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${i === idx ? "bg-primary text-primary-foreground border-primary" : "bg-cream/90 border-border hover:border-primary/50 text-foreground"}`}>
            {isAreaDone(x) && <CheckCircle2 className={`w-3.5 h-3.5 ${i === idx ? "" : "text-forest"}`} />}
            <span>{i + 1}. {x.sr}</span>
          </button>
        ))}
      </div>

      {mode === "theory" ? (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">{a.sr}</h3>
              <p className="text-xs text-muted-foreground">{a.title} · {a.words.length} reči</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => speakLines(active.map((w) => ({ speaker: "m", text: w.word.split(" / ")[0].replace("…", "") })), lang)}>
              <Volume2 className="w-4 h-4" /> Poslušaj reči
            </Button>
          </div>

          {(a.images || []).length > 0 && (
            <div className={`grid gap-3 ${(a.images || []).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(a.images || []).map((k) => IMAGES[k] && (
                <button key={k} type="button" onClick={() => setZoom(IMAGES[k])} aria-label="Uvećaj ilustraciju"
                  className="group relative rounded-2xl border border-border/60 bg-background/60 overflow-hidden shadow-card-soft">
                  <img src={IMAGES[k]} alt={a.title} loading="lazy" width={1448} height={1086}
                    className="w-full max-h-64 object-contain mx-auto" />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-xs text-foreground border border-border/60">
                    <ZoomIn className="w-3.5 h-3.5" /> Uvećaj
                  </span>
                </button>
              ))}
            </div>
          )}

          {active.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Osnovne reči</CardTitle></CardHeader>
              <CardContent><ul className="grid sm:grid-cols-2 gap-2">{active.map((w) => <WordCard key={w.word} w={w} />)}</ul></CardContent>
            </Card>
          )}
          {passive.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Dodatne reči iz lekcije — dovoljno je da ih prepoznaš</CardTitle></CardHeader>
              <CardContent><ul className="grid sm:grid-cols-2 gap-2">{passive.map((w) => <WordCard key={w.word} w={w} />)}</ul></CardContent>
            </Card>
          )}
          {a.examples && a.examples.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MessageSquareQuote className="w-4 h-4 text-accent" /> Korisni primeri</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {a.examples.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm">
                      <button onClick={() => speakLines([{ speaker: "m", text: e }], lang)} className="text-primary/60 hover:text-primary" aria-label="Poslušaj"><Volume2 className="w-4 h-4" /></button>
                      <span className="italic">{e}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            {areaEx.length > 0 && <Button variant="hero" size="sm" onClick={() => setMode("practice")}><PenLine className="w-4 h-4" /> Provežbaj ovu oblast</Button>}
            {idx < areas.length - 1 && <Button variant="outline" size="sm" onClick={() => setIdx(idx + 1)}>Sledeća oblast <ArrowRight className="w-4 h-4" /></Button>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-display text-xl text-primary">{a.sr} — vežbe</h3>
          <div className="flex flex-wrap gap-2">
            {areaEx.map((ex, i) => {
              const d = done.includes(ex.code), cur = i === exIdx;
              return (
                <button key={ex.id} type="button" onClick={() => setExIdx(i)} aria-label={`Vežba ${i + 1}`}
                  className={`w-10 h-10 rounded-full text-sm font-semibold border-2 flex items-center justify-center transition-all ${cur ? "bg-primary text-primary-foreground border-primary scale-110 shadow-card-soft" : d ? "bg-forest/15 border-forest text-forest" : "bg-cream/90 border-border text-foreground hover:border-primary/50"}`}>
                  {d && !cur ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
              );
            })}
          </div>
          {areaEx[exIdx] && (
            <LessonExercise key={areaEx[exIdx].id} exercise={areaEx[exIdx]} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={done.includes(areaEx[exIdx].code)} onDone={markDone} />
          )}
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" disabled={exIdx === 0} onClick={() => setExIdx(exIdx - 1)}>← Prethodna</Button>
            {exIdx < areaEx.length - 1 ? (
              <Button variant="hero" size="sm" onClick={() => setExIdx(exIdx + 1)}>Sledeća vežba <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setMode("theory")}>Nazad na gradivo</Button>
            )}
          </div>
          {isAreaDone(a) && <p className="text-sm rounded-xl bg-forest/10 border border-forest/30 p-3">🎉 Bravo! Završila/o si sve vežbe ove oblasti.</p>}
        </div>
      )}
    </div>
  );
}
