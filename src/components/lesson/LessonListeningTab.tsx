import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Eye, EyeOff, Volume2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Headphones } from "lucide-react";
import { speakLines, stopSpeaking, type DialogueLine } from "@/lib/courseLessons";
import { logActivity } from "@/lib/logActivity";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Q = { prompt: string; options: string[]; answer: string; explanation?: string };
export type ListeningScene = { id: string; title: string; context?: string; lines: DialogueLine[]; questions: Q[] };

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function Scene({ scene, lang, lessonCode }: { scene: ListeningScene; lang: string; lessonCode: string }) {
  const { user } = useAuth();
  const [rate, setRate] = useState(0.95);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [showT, setShowT] = useState(false);
  const opts = useMemo(() => scene.questions.map((q) => shuffle(q.options)), [scene]);
  const done = Object.keys(picked).length === scene.questions.length;
  const correct = scene.questions.filter((q, i) => picked[i] === q.answer).length;

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    if (done && user) {
      logActivity(user.id, "listening", "lesson_scene", 5 + correct * 3, { lesson: lessonCode, scene: scene.id, score: correct },
        { dedupKey: `lesson_listen_${lessonCode}_${scene.id}`, language: lang as "en" });
      setShowT(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const play = () => {
    setPlaying(true);
    speakLines(scene.lines, lang, { rate, onLine: setActive, onEnd: () => { setPlaying(false); setActive(null); } });
  };
  const stop = () => { stopSpeaking(); setPlaying(false); setActive(null); };
  const q = scene.questions[step];
  const ans = picked[step];

  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-4">
      <div>
        <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2"><Headphones className="w-4 h-4" />{scene.title}</h3>
        {scene.context && <p className="text-sm text-muted-foreground mt-1">{scene.context}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {playing ? <Button size="sm" variant="outline" onClick={stop}><Square className="w-4 h-4" /> Stop</Button>
          : <Button size="sm" variant="hero" onClick={play}><Play className="w-4 h-4" /> Slušaj</Button>}
        {[{ r: 0.7, l: "0.75x lagano" }, { r: 0.95, l: "1x prirodno" }].map((o) => (
          <Button key={o.r} size="sm" variant={rate === o.r ? "default" : "outline"} onClick={() => setRate(o.r)}>{o.l}</Button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {scene.questions.map((qq, i) => (
          <button key={i} onClick={() => setStep(i)} className={cn("w-8 h-8 rounded-full text-sm border transition-colors",
            i === step ? "border-primary bg-primary text-primary-foreground" :
            picked[i] !== undefined ? (picked[i] === qq.answer ? "border-forest bg-forest/15" : "border-destructive bg-destructive/10") : "border-border bg-background")}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-background/70 p-4">
        <p className="font-medium text-primary mb-3">{q.prompt}</p>
        <div className="grid gap-2">
          {opts[step].map((o) => {
            const st = ans === undefined ? undefined : o === q.answer ? "right" : ans === o ? "wrong" : undefined;
            return (
              <button key={o} disabled={ans !== undefined} onClick={() => setPicked((p) => ({ ...p, [step]: o }))}
                className={cn("text-left rounded-xl border px-4 py-2.5 text-sm",
                  st === "right" ? "border-forest bg-forest/10" : st === "wrong" ? "border-destructive bg-destructive/10" : "border-border/60 bg-background hover:border-primary/40")}>
                {o}
              </button>
            );
          })}
        </div>
        {ans !== undefined && (
          <div className={cn("mt-3 rounded-xl px-4 py-3 text-sm", ans === q.answer ? "bg-forest/10" : "bg-destructive/10")}>
            <p className="font-medium flex items-center gap-1.5">
              {ans === q.answer ? <CheckCircle2 className="w-4 h-4 text-forest" /> : <XCircle className="w-4 h-4 text-destructive" />}
              {ans === q.answer ? "Tačno!" : "Netačno"}
            </p>
            {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
          </div>
        )}
        <div className="mt-3 flex justify-between">
          <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="w-4 h-4" /> Nazad</Button>
          <Button size="sm" variant="outline" disabled={step === scene.questions.length - 1} onClick={() => setStep(step + 1)}>Dalje <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {done && <p className="text-sm font-medium text-primary">Rezultat: {correct} / {scene.questions.length}</p>}

      <button className="text-xs text-primary/70 flex items-center gap-1" onClick={() => setShowT(!showT)}>
        {showT ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showT ? "Sakrij transkript" : "Prikaži transkript"}
      </button>
      {showT && (
        <ul className="space-y-1.5">
          {scene.lines.map((l, i) => (
            <li key={i} className={cn("flex items-start gap-2 rounded-lg px-2 py-1", active === i && "bg-secondary")}>
              <button aria-label="Pusti rečenicu" onClick={() => speakLines([l], lang, { rate })} className="text-primary/60 hover:text-primary mt-0.5"><Volume2 className="w-4 h-4" /></button>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">{l.speaker}</span>
              <span className="text-sm text-foreground">{l.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LessonListeningTab({ scenes, lang, lessonCode }: { scenes: ListeningScene[]; lang: string; lessonCode: string }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">Nove situacije sa rečima iz lekcije. Prvo slušaj bez teksta, pa odgovaraj korak po korak. Transkript se otvara na kraju ili na zahtev.</p>
      {scenes.map((s) => <Scene key={s.id} scene={s} lang={lang} lessonCode={lessonCode} />)}
    </>
  );
}
