import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { loadLessonContent, speakLines, type Exercise } from "@/lib/courseLessons";
import LessonExercise from "@/components/lesson/LessonExercise";
import VocabularyPracticeExercise from "@/components/lesson/VocabularyPracticeExercise";
import { vocabularyXp, type VocabularyPracticeExercise as Practice } from "@/lib/vocabularyPractice";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, BookOpen, ArrowRight, CheckCircle2, MessageSquareQuote, PenLine, Layers, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import v1 from "@/assets/lessons/en-a1-l01-vocab-1.webp.asset.json";
import v2 from "@/assets/lessons/en-a1-l01-vocab-2.webp.asset.json";
import v3 from "@/assets/lessons/en-a1-l01-vocab-3.webp.asset.json";
import v4 from "@/assets/lessons/en-a1-l01-vocab-4.webp.asset.json";

import a2v1 from "@/assets/lessons/en-a2-l01-vocab-1.webp.asset.json";
import a2v2 from "@/assets/lessons/en-a2-l01-vocab-2.webp.asset.json";
import a2v3 from "@/assets/lessons/en-a2-l01-vocab-3.webp.asset.json";
import wordPics from "@/content/lessons/EN-A1-L01.vocab-images.json";
import wordPicsA2 from "@/content/lessons/EN-A2-L01.vocab-images.json";
import hcvo1 from "@/assets/lessons/hc-b1-l01-vo1.jpg";
import wordPicsNoA2 from "@/content/lessons/NO-A2-L01.vocab-images.json";

const IMAGES: Record<string, string> = { v1: v1.url, v2: v2.url, v3: v3.url, v4: v4.url, a2v1: a2v1.url, a2v2: a2v2.url, a2v3: a2v3.url, hcvo1 };
const PICS: Record<string, Record<string, string>> = {};
for (const src of [wordPics, wordPicsA2, wordPicsNoA2] as Record<string, Record<string, string>>[]) {
  for (const [k, v] of Object.entries(src)) PICS[k] = { ...PICS[k], ...v };
}
const HC_PICS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob("@/assets/lessons/hc/hc-vo-*.jpg", { eager: true, import: "default" }) as Record<string, string>)
    .map(([path, url]) => [(path.split("/").pop() ?? "").replace(".jpg", ""), url]),
);
const picFor = (w: string, imgs: string[] = [], img?: string) => {
  if (img && HC_PICS[img]) return HC_PICS[img];
  for (const k of imgs) { const u = PICS[k]?.[w]; if (u) return u; }
  for (const k of Object.keys(PICS)) { const u = PICS[k][w]; if (u) return u; }
  return undefined;
};

interface Word { word: string; translation: string; example?: string; active?: boolean; img?: string }
interface Area { key: string; title: string; sr: string; images?: string[]; words: Word[]; examples?: string[]; exercises: string[] }

let sharedIdx = 0;

export default function LessonVocabularyTab({ lessonId, mode, onPractice, onFlashcards }: { lessonId: string; mode: "theory" | "practice"; onPractice: () => void; onFlashcards?: (areaKey: string) => void }) {
  const { user } = useAuth();
  const [row, setRow] = useState<any>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [awardedCodes, setAwardedCodes] = useState<string[]>([]);
  const pendingAwards = useRef(new Set<string>());
  const [idx, setIdxState] = useState(sharedIdx);
  const setIdx = (i: number) => { sharedIdx = i; setIdxState(i); };
  useEffect(() => { setIdxState(sharedIdx); }, [mode]);
  const [exIdx, setExIdx] = useState(0);

  useEffect(() => {
    (async () => {
      setDone([]); setAwardedCodes([]);
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
        const { data: awards } = await supabase.from("activities").select("payload").eq("user_id", user.id)
          .eq("language", data.language).eq("type", "lesson_vocabulary_exercise").contains("payload", { lesson_id: lessonId });
        setAwardedCodes((awards ?? []).flatMap((award) => {
          const payload = award.payload as { code?: string } | null;
          return typeof payload?.code === "string" ? [payload.code] : [];
        }));
      }
    })();
  }, [lessonId, user]);

  useEffect(() => { setExIdx(0); setAiEx(null); }, [idx, mode]);
  const [aiEx, setAiEx] = useState<Exercise[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  async function genMore() {
    const cur = areas[Math.min(idx, areas.length - 1)];
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke("vocabulary-ai", {
      body: { action: "generate_lesson_exercises", theme: cur.title, exclude_words: cur.words.map((w) => w.word), level: row?.cefr_level || "A1", language: row?.language || "en" },
    });
    setAiLoading(false);
    if (error || !Array.isArray(data?.exercises)) { toast.error("AI vežbe trenutno nisu dostupne. Pokušaj ponovo."); return; }
    const t = Date.now();
    setAiEx(data.exercises.map((e: any, i: number) => ({ id: `ai-${t}-${i}`, code: `AI-${t}-${i}`, kind: "vocabulary", title: e.title || "Vežba", instruction: e.instruction || "", items: e.items || [] })));
  }

  if (!row || !areas.length) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje reči lekcije…</p>;
  const lang = row.language || "en";
  const a = areas[Math.min(idx, areas.length - 1)];
  const practice = exercises.filter((e) => "type" in e && "xp" in e) as unknown as Practice[];
  const isDone = (code: string) => practice.some((e) => e.code === code) ? awardedCodes.includes(code) : done.includes(code);
  const areaEx = a.exercises?.length ? exercises.filter((e) => (a.exercises ?? []).includes(e.code)) : (idx === 0 ? exercises : []);
  const isAreaDone = (x: Area) => (x.exercises?.length ?? 0) > 0 && (x.exercises ?? []).every(isDone);
  const totalXp = practice.reduce((total, ex) => total + ex.xp, 0);
  const gainedXp = vocabularyXp(practice, awardedCodes);
  const active = a.words.filter((w) => w.active !== false);
  const passive = a.words.filter((w) => w.active === false);
  const say = (t: string) => speakLines([{ speaker: "m", text: t.split(" / ")[0].replace("…", "") }], lang);

  async function markDone(code: string) {
    const ex = practice.find((item) => item.code === code);
    if (ex) {
      if (!user || awardedCodes.includes(code) || pendingAwards.current.has(code)) return;
      pendingAwards.current.add(code);
      try {
        const { error: rewardError } = await supabase.rpc("complete_medical_vocabulary", { _lesson_id: row.id, _code: code });
        if (rewardError) { toast.error("Poeni nisu sačuvani. Pokušaj ponovo."); return; }
        setAwardedCodes((previous) => [...new Set([...previous, code])]);
        const { data: current } = await supabase.from("course_lesson_progress").select("completed_steps")
          .eq("user_id", user.id).eq("lesson_id", row.id).maybeSingle();
        setDone(Array.isArray(current?.completed_steps) ? current.completed_steps as string[] : [...new Set([...done, code])]);
      } finally { pendingAwards.current.delete(code); }
      return;
    }
    if (!user || done.includes(code)) return;
    const next = [...done, code];
    setDone(next);
    await supabase.from("course_lesson_progress").upsert({
      user_id: user.id, lesson_id: row.id, language: row.language, completed_steps: next, status: "in_progress",
    }, { onConflict: "user_id,lesson_id" });
  }

  const WordCard = ({ w }: { w: Word }) => {
    const pic = picFor(w.word, a.images, w.img);
    if (pic) return (
      <li className="rounded-2xl border border-border/50 bg-background/80 overflow-hidden shadow-card-soft">
        <button type="button" onClick={() => say(w.word)} aria-label={`Izgovori ${w.word}`}
          className="group relative block w-full bg-cream/60">
          <img src={pic} alt={w.word} loading="lazy" className="w-full aspect-[4/3] object-contain transition-transform group-hover:scale-105 group-active:scale-95" />
          <span className="absolute top-2 right-2 rounded-full bg-background/85 backdrop-blur p-1.5 border border-border/60 text-primary">
            <Volume2 className="w-3.5 h-3.5" />
          </span>
        </button>
        <div className="px-3 py-2">
          <p className="font-semibold text-primary leading-snug break-words hyphens-auto">{w.word}</p>
          <p className="text-xs text-muted-foreground">{w.translation}</p>
          {w.example && <p className="text-xs italic text-primary/70 mt-0.5">„{w.example}“</p>}
        </div>
      </li>
    );
    return (
      <li className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2.5 col-span-2 sm:col-span-1">
        <button onClick={() => say(w.word)} className="text-primary/60 hover:text-primary shrink-0" aria-label={`Izgovori ${w.word}`}>
          <Volume2 className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{w.word}</p>
          <p className="text-sm text-muted-foreground">{w.translation}</p>
        </div>
      </li>
    );
  };
  const grid = a.words.some((w) => w.word.length > 16) ? "grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3";

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
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">{a.sr}</h3>
            <p className="text-xs text-muted-foreground">{a.title} · {a.words.length} reči</p>
          </div>


          <p className="text-xs text-muted-foreground">Klikni na sličicu da čuješ izgovor.</p>

          {active.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Osnovne reči</CardTitle></CardHeader>
              <CardContent><ul className={grid}>{active.map((w) => <WordCard key={w.word} w={w} />)}</ul></CardContent>
            </Card>
          )}
          {passive.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Dodatne reči iz lekcije — dovoljno je da ih prepoznaš</CardTitle></CardHeader>
              <CardContent><ul className={grid}>{passive.map((w) => <WordCard key={w.word} w={w} />)}</ul></CardContent>
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
            <div className="flex flex-wrap gap-2">
              {areaEx.length > 0 && <Button variant="hero" size="sm" onClick={onPractice}><PenLine className="w-4 h-4" /> Provežbaj ovu oblast</Button>}
              {onFlashcards && <Button variant="outline" size="sm" onClick={() => onFlashcards(a.key)}><Layers className="w-4 h-4" /> Provežbaj kroz fleš-kartice</Button>}
            </div>
            {idx < areas.length - 1 && <Button variant="outline" size="sm" onClick={() => setIdx(idx + 1)}>Sledeća oblast <ArrowRight className="w-4 h-4" /></Button>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-display text-xl text-primary">{a.sr} — vežbe</h3>
          {totalXp > 0 && <div className="space-y-2">
            <p className="text-sm font-semibold text-primary" aria-live="polite">Osvojeno: {gainedXp} / {totalXp} XP</p>
            <Progress value={gainedXp / totalXp * 100} />
          </div>}
          <div className="flex flex-wrap gap-2">
            {areaEx.map((ex, i) => {
              const d = isDone(ex.code), cur = i === exIdx;
              return (
                <button key={ex.id} type="button" onClick={() => setExIdx(i)} aria-label={`Vežba ${i + 1}`}
                  className={`w-10 h-10 rounded-full text-sm font-semibold border-2 flex items-center justify-center transition-all ${cur ? "bg-primary text-primary-foreground border-primary scale-110 shadow-card-soft" : d ? "bg-forest/15 border-forest text-forest" : "bg-cream/90 border-border text-foreground hover:border-primary/50"}`}>
                  {d && !cur ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </button>
              );
            })}
          </div>
          {areaEx[exIdx] && (practice.some((e) => e.code === areaEx[exIdx].code) ?
            <VocabularyPracticeExercise key={areaEx[exIdx].id} exercise={areaEx[exIdx] as unknown as Practice} pictures={HC_PICS} done={isDone(areaEx[exIdx].code)} onDone={markDone} /> :
            <LessonExercise key={areaEx[exIdx].id} exercise={areaEx[exIdx]} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={isDone(areaEx[exIdx].code)} onDone={markDone} />
          )}
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" disabled={exIdx === 0} onClick={() => setExIdx(exIdx - 1)}>← Prethodna</Button>
            {exIdx < areaEx.length - 1 ? (
              <Button variant="hero" size="sm" onClick={() => setExIdx(exIdx + 1)}>Sledeća vežba <ArrowRight className="w-4 h-4" /></Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onPractice}>Nazad na gradivo</Button>
            )}
          </div>
          {isAreaDone(a) && <p className="text-sm rounded-xl bg-forest/10 border border-forest/30 p-3">Bravo! Završila/o si sve vežbe ove oblasti.</p>}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            {!aiEx ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm flex-1">Želiš još? AI pravi nove slične vežbe od reči ove oblasti za tvoj nivo.</p>
                <Button variant="hero" size="sm" disabled={aiLoading} onClick={genMore}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Provežbaj još
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {aiEx.map((ex) => <LessonExercise key={ex.id} exercise={ex} language={lang} level={row.cefr_level} lessonTitle={row.title_target || row.title} done={false} onDone={() => {}} />)}
                <Button variant="outline" size="sm" disabled={aiLoading} onClick={genMore}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Nove vežbe
                </Button>
              </div>
            )}
          </div>
          {idx < areas.length - 1 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => { setIdx(idx + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Sledeća oblast: {areas[idx + 1].sr} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface LessonFlashArea { key: string; sr: string; words: { word: string; translation: string; example?: string; pic?: string }[] }
/** All lesson vocabulary grouped by area, each word with its illustration. */
export async function loadLessonFlashcards(lessonId: string): Promise<{ lang: string; areas: LessonFlashArea[] }> {
  const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
  if (!data) return { lang: "en", areas: [] };
  const v = (await loadLessonContent(data as any)).modules?.vocabulary;
  const raw: Area[] = Array.isArray(v?.areas) ? v.areas : [{ key: "_", title: "Reči", sr: "Reči", exercises: [], words: v?.words || [] }];
  return {
    lang: (data as any).language || "en",
    areas: raw.map((x) => ({ key: x.key, sr: x.sr, words: x.words.map((w) => ({ ...w, pic: picFor(w.word, x.images, (w as Word).img) ?? (x.images?.[0] ? IMAGES[x.images[0]] : undefined) })) })),
  };
}
