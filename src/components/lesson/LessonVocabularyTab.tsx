import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadLessonContent, speakLines } from "@/lib/courseLessons";
import { Volume2 } from "lucide-react";

interface Word { word: string; translation: string; example?: string; collection?: string; active?: boolean }

const SR_NAMES: Record<string, string> = {
  "Greetings & Farewells": "Pozdravi i rastanci",
  "Introducing People": "Upoznavanje",
  "Feelings & Polite Responses": "Osećanja i ljubazni odgovori",
  "In the Classroom": "U učionici",
  "Alphabet & Numbers": "Alfabet i brojevi",
};

export default function LessonVocabularyTab({ lessonId }: { lessonId: string }) {
  const [lang, setLang] = useState("en");
  const [groups, setGroups] = useState<{ key: string; name: string; words: Word[] }[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
      if (!data) return;
      setLang((data as any).language || "en");
      const c = await loadLessonContent(data as any);
      const v = c.modules?.vocabulary;
      if (!v) return;
      const words: Word[] = v.words || [];
      const cols: Record<string, string> = v.collections || { _: "Reči" };
      setGroups(Object.entries(cols).map(([key, name]) => ({
        key, name: String(name), words: words.filter((w) => key === "_" || w.collection === key),
      })).filter((g) => g.words.length));
    })();
  }, [lessonId]);

  if (!groups.length) return <p className="text-sm text-muted-foreground text-center py-8">Učitavanje reči lekcije…</p>;
  const g = groups[Math.min(idx, groups.length - 1)];
  const active = g.words.filter((w) => w.active !== false);
  const passive = g.words.filter((w) => w.active === false);
  const say = (t: string) => speakLines([{ speaker: "m", text: t.split(" / ")[0] }], lang);

  const WordCard = ({ w }: { w: Word }) => (
    <li className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/80 p-3">
      <button onClick={() => say(w.word)} className="mt-0.5 text-primary/60 hover:text-primary shrink-0" aria-label={`Izgovori ${w.word}`}>
        <Volume2 className="w-4 h-4" />
      </button>
      <div className="min-w-0">
        <p className="font-semibold text-primary">{w.word}</p>
        <p className="text-sm text-muted-foreground">{w.translation}</p>
        {w.example && <p className="text-xs italic text-primary/70 mt-1">„{w.example}“</p>}
      </div>
    </li>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {groups.map((gr, i) => (
          <button key={gr.key} onClick={() => setIdx(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs sm:text-sm border transition ${i === idx ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}>
            {SR_NAMES[gr.name] || gr.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-primary">{SR_NAMES[g.name] || g.name}</h3>
          <p className="text-xs text-muted-foreground">{g.name} · {g.words.length} reči</p>
        </div>
        {active.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Aktivne reči — koristi ih u govoru i pisanju</h4>
            <ul className="grid sm:grid-cols-2 gap-2">{active.map((w) => <WordCard key={w.word} w={w} />)}</ul>
          </section>
        )}
        {passive.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Receptivne reči — dovoljno je da ih razumeš</h4>
            <ul className="grid sm:grid-cols-2 gap-2">{passive.map((w) => <WordCard key={w.word} w={w} />)}</ul>
          </section>
        )}
        <div className="flex justify-between pt-2">
          <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="text-sm text-primary disabled:opacity-30">← Prethodna celina</button>
          <button disabled={idx >= groups.length - 1} onClick={() => setIdx(idx + 1)} className="text-sm text-primary disabled:opacity-30">Sledeća celina →</button>
        </div>
      </div>
    </div>
  );
}
