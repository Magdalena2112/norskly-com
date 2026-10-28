import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, MessageSquare, Volume2 } from "lucide-react";
import { speakLines, stopSpeaking, type Exercise } from "@/lib/courseLessons";
import { ITEM_IMAGES } from "@/content/lessons/itemImages";
import LessonExercise from "./LessonExercise";

// Universal culture tab: all content comes from the lesson's `modules.culture` data.
interface CultureCard { title: string; text: string; example?: string }
interface CultureTopic { title: string; image?: string; text: string; comparison?: string; fact?: string; keywords?: { term: string; meaning: string }[]; compareTable?: { left: string; right: string; rows: { label: string; left: string; right: string }[] }; questions?: string[] }
const COMPARE_LABEL: Record<string, string> = {
  en: "🇬🇧 Velika Britanija vs. Srbija 🇷🇸",
  no: "🇳🇴 Norveška vs. Srbija 🇷🇸",
  de: "🇩🇪 Nemačka vs. Srbija 🇷🇸",
};
export interface CultureData {
  title: string; body: string; note?: string;
  customs?: CultureCard[]; comparison?: CultureCard[]; exercises?: Exercise[];
  topics?: CultureTopic[];
}

export default function LessonCultureTab(props: {
  data: CultureData; lang: "no" | "en" | "de"; level: string; lessonTitle: string;
  done: string[]; onDone: (code: string) => void; onTalk: () => void; onFinish?: () => void;
}) {
  if (props.data.topics?.length) return <CultureTopics data={props.data} lang={props.lang} onFinish={props.onFinish} />;
  return <ClassicCulture {...props} />;
}

function CultureTopics({ data, lang, onFinish }: { data: CultureData; lang: string; onFinish?: () => void }) {
  const topics = data.topics!;
  const [i, setI] = useState(0);
  const t = topics[i];
  const go = (n: number) => { stopSpeaking(); setI(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-semibold text-xl text-primary">{data.title}</h3>
        {data.body && <p className="text-sm text-muted-foreground mt-1">{data.body}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {topics.map((x, n) => (
          <button key={x.title} onClick={() => go(n)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition ${n === i ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"}`}>
            {n + 1}. {x.title}
          </button>
        ))}
      </div>
      <section className={`rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft grid ${t.image && ITEM_IMAGES[t.image] ? "md:grid-cols-2" : ""} gap-5 items-start`}>
        {t.image && ITEM_IMAGES[t.image] && (
          <img src={ITEM_IMAGES[t.image]} alt={t.title} className="w-full rounded-xl object-cover" loading="lazy" />
        )}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="font-display font-semibold text-lg text-primary">{t.title}</h4>
            <Button size="sm" variant="outline" onClick={() => speakLines([{ speaker: "n", text: t.text }], lang)}><Volume2 className="w-4 h-4" /> Slušaj</Button>
          </div>
          <p className="leading-relaxed whitespace-pre-line">{t.text}</p>
        </div>
      </section>
      {t.compareTable && (
        <div className="rounded-2xl border border-border/60 bg-background/70 overflow-hidden">
          <div className="grid grid-cols-[1fr_1.3fr_1.3fr] text-sm">
            <div className="bg-primary text-primary-foreground px-3 py-2 font-semibold" />
            <div className="bg-primary text-primary-foreground px-3 py-2 font-semibold">{t.compareTable.left}</div>
            <div className="bg-primary text-primary-foreground px-3 py-2 font-semibold">{t.compareTable.right}</div>
            {t.compareTable.rows.map((r, n) => (
              <div key={r.label} className={`contents ${n % 2 ? "" : "[&>div]:bg-primary/5"}`}>
                <div className="px-3 py-2 font-medium text-primary">{r.label}</div>
                <div className="px-3 py-2">{r.left}</div>
                <div className="px-3 py-2">{r.right}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!!t.questions?.length && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <p className="font-semibold text-primary mb-2">{lang === "de" ? "Denk nach und sprich" : lang === "en" ? "Think and talk" : "Tenk og snakk"}</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm">{t.questions.map((q) => <li key={q}>{q}</li>)}</ol>
        </div>
      )}
      {!!t.keywords?.length && (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="font-semibold text-primary mb-3">Korisne reči i izrazi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {t.keywords.map((k) => (
              <button key={k.term} onClick={() => speakLines([{ speaker: "n", text: k.term }], lang)}
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-left hover:bg-primary/10 transition">
                <Volume2 className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                <span className="min-w-0"><span className="font-medium text-primary">{k.term}</span> <span className="text-muted-foreground">– {k.meaning}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {t.comparison && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-primary mb-1">{COMPARE_LABEL[lang] || "Poređenje sa Srbijom"}</p>
            <p className="text-sm">{t.comparison}</p>
          </div>
        )}
        {t.fact && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="font-semibold text-primary mb-1 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Da li znaš?</p>
            <p className="text-sm">{t.fact}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={i === 0} onClick={() => go(i - 1)}><ChevronLeft className="w-4 h-4" /> Prethodna tema</Button>
        {i < topics.length - 1
          ? <Button size="sm" onClick={() => go(i + 1)}>Sledeća tema <ChevronRight className="w-4 h-4" /></Button>
          : <Button size="sm" variant="hero" onClick={() => { stopSpeaking(); onFinish?.(); }}><CheckCircle2 className="w-4 h-4" /> Završi kulturu</Button>}
      </div>
    </div>
  );
}

function ClassicCulture({ data, lang, level, lessonTitle, done, onDone, onTalk }: {
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
