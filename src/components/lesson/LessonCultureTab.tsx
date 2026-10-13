import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, MessageSquare, Volume2 } from "lucide-react";
import { speakLines, type Exercise } from "@/lib/courseLessons";
import LessonExercise from "./LessonExercise";

// Universal culture tab: all content comes from the lesson's `modules.culture` data.
interface CultureCard { title: string; text: string; example?: string }
export interface CultureData {
  title: string; body: string; note?: string;
  customs?: CultureCard[]; comparison?: CultureCard[]; exercises?: Exercise[];
}

export default function LessonCultureTab({ data, lang, level, lessonTitle, done, onDone, onTalk }: {
  data: CultureData; lang: "no" | "en" | "de"; level: string; lessonTitle: string;
  done: string[]; onDone: (code: string) => void; onTalk: () => void;
}) {
  const [view, setView] = useState<"learn" | "practice">("learn");
  const [idx, setIdx] = useState(0);
  const exercises = data.exercises || [];
  const ex = exercises[Math.min(idx, exercises.length - 1)];

  return (
    <div className="space-y-5">
      {!!exercises.length && (
        <div className="flex gap-2">
          {(["learn", "practice"] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>
              {v === "learn" ? "Gradivo" : "Vežbe"}
            </Button>
          ))}
        </div>
      )}

      {view === "learn" || !exercises.length ? (
        <>
          <section className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-display font-semibold text-lg text-primary">{data.title}</h3>
              <Button size="sm" variant="outline" onClick={() => speakLines([{ speaker: "n", text: data.body }], lang)}><Volume2 className="w-4 h-4" /> Slušaj</Button>
            </div>
            <p className="leading-relaxed whitespace-pre-line">{data.body}</p>
            {data.note && <p className="text-sm text-muted-foreground mt-3">{data.note}</p>}
          </section>

          {!!data.customs?.length && (
            <section>
              <h4 className="font-display font-semibold text-primary mb-3">Lokalni običaji</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {data.customs.map((c) => (
                  <div key={c.title} className="rounded-2xl border border-border/60 bg-cream/90 p-4 shadow-card-soft">
                    <p className="font-semibold text-primary">{c.title}</p>
                    <p className="text-sm mt-1">{c.text}</p>
                    {c.example && (
                      <button className="mt-2 text-sm italic text-primary/80 flex items-center gap-1 text-left"
                        onClick={() => speakLines([{ speaker: "n", text: c.example! }], lang)}>
                        <Volume2 className="w-3.5 h-3.5 shrink-0" /> {c.example}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!!data.comparison?.length && (
            <section className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
              <h4 className="font-display font-semibold text-primary mb-3">Poređenje sa srpskim i zamke</h4>
              <ul className="space-y-3">
                {data.comparison.map((c) => (
                  <li key={c.title}><p className="font-semibold text-sm text-primary">{c.title}</p><p className="text-sm">{c.text}</p></li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            {!!exercises.length && <Button variant="hero" onClick={() => setView("practice")}>Provežbaj</Button>}
            <Button variant="outline" onClick={onTalk}><MessageSquare className="w-4 h-4" /> Isprobaj bonton u razgovoru</Button>
          </div>
        </>
      ) : !ex ? (
        <p className="text-sm text-muted-foreground">Ova lekcija nema vežbe za kulturu.</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {exercises.map((e, i) => (
              <button key={e.code} onClick={() => setIdx(i)}
                className={`shrink-0 w-9 h-9 rounded-full text-sm font-medium border transition flex items-center justify-center ${i === idx ? "bg-primary text-primary-foreground border-primary" : done.includes(e.code) ? "bg-accent/30 text-primary border-accent" : "bg-background text-muted-foreground border-border"}`}>
                {done.includes(e.code) && i !== idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </button>
            ))}
          </div>
          <LessonExercise key={ex.code} exercise={ex} language={lang} level={level} lessonTitle={lessonTitle}
            done={done.includes(ex.code)} onDone={onDone} />
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}><ChevronLeft className="w-4 h-4" /> Nazad</Button>
            {idx < exercises.length - 1
              ? <Button size="sm" onClick={() => setIdx(idx + 1)}>Sledeći <ChevronRight className="w-4 h-4" /></Button>
              : <Button size="sm" onClick={onTalk}><MessageSquare className="w-4 h-4" /> Razgovor</Button>}
          </div>
        </>
      )}
    </div>
  );
}
