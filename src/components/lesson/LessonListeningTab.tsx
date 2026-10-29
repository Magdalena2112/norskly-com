import { useSavedState } from "@/lib/savedAnswers";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Eye, EyeOff, Volume2, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { speakLines, stopSpeaking, type DialogueLine } from "@/lib/courseLessons";
import { logActivity } from "@/lib/logActivity";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Q = { prompt: string; options: string[]; answer: string; explanation?: string };
export type ListeningScene = { id: string; code?: string; xp?: number; title: string; context?: string; lines: DialogueLine[]; questions: Q[] };
type Answers = Record<string, Record<number, string>>;

export default function LessonListeningTab({ scenes, lang, lessonCode, completed = [], onDone, onFinish }: {
  scenes: ListeningScene[]; lang: "no" | "en" | "de"; lessonCode: string;
  completed?: string[]; onDone?: (code: string) => void; onFinish?: () => void;
}) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [questionSteps, setQuestionSteps] = useSavedState<Record<string, number>>(`li:${lessonCode}:steps`, {});
  const [answers, setAnswers] = useSavedState<Answers>(`li:${lessonCode}:answers`, {});
  const [transcripts, setTranscripts] = useState<Record<string, boolean>>({});
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const awarded = useRef(new Set<string>());
  const options = useMemo(() => Object.fromEntries(scenes.map(s => [s.id, s.questions.map(q => {
    const result = [...q.options];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  })])), [scenes]);
  useEffect(() => () => stopSpeaking(), []);
  const scene = scenes[Math.min(index, scenes.length - 1)];
  if (!scene) return null;
  const step = Math.min(questionSteps[scene.id] || 0, scene.questions.length - 1);
  const q = scene.questions[step];
  const picked = answers[scene.id] || {};
  const ans = picked[step];
  const code = scene.code || scene.id;
  const done = scene.questions.length > 0 && scene.questions.every((_, i) => picked[i] !== undefined);
  const correct = scene.questions.filter((question, i) => picked[i] === question.answer).length;
  const stop = () => { stopSpeaking(); setPlaying(false); setActive(null); };
  const change = (i: number) => { stop(); setIndex(i); };
  const play = (lines = scene.lines) => {
    stop();
    if (!window.speechSynthesis || !lines.length) { toast.error("Audio trenutno nije dostupan u ovom pregledaču."); return; }
    setPlaying(true);
    speakLines(lines, lang, { rate, onLine: setActive, onEnd: () => { setPlaying(false); setActive(null); } });
  };
  const select = (value: string) => {
    if (ans !== undefined) return;
    const next = { ...picked, [step]: value };
    setAnswers(previous => ({ ...previous, [scene.id]: next }));
    if (scene.questions.every((_, i) => next[i] !== undefined)) {
      setTranscripts(previous => ({ ...previous, [scene.id]: true }));
      if (user && !completed.includes(code) && !awarded.current.has(code)) {
        awarded.current.add(code);
        const score = scene.questions.filter((question, i) => next[i] === question.answer).length;
        void logActivity(user.id, "listening", "lesson_scene", scene.xp ?? 1,
          { lesson: lessonCode, code, scene: scene.id, score, total: scene.questions.length },
          { dedupKey: `lesson_listen_${lessonCode}_${code}_${lang}`, language: lang }).catch(() => {
            awarded.current.delete(code);
            setAnswers(previous => ({ ...previous, [scene.id]: picked }));
            toast.error("Poeni nisu sačuvani. Pokušaj ponovo.");
          });
      }
      onDone?.(code);
    }
  };

  return (
    <section className="space-y-5" aria-label="Aktivnosti slušanja">
      <nav className="flex flex-wrap gap-2" aria-label="Izbor aktivnosti">
        {scenes.map((s, i) => {
          const finished = completed.includes(s.code || s.id) || s.questions.every((_, j) => answers[s.id]?.[j] !== undefined);
          return <Button key={s.id} variant="outline" size="icon" aria-label={`Aktivnost ${i + 1}${finished ? ", završena" : ""}`} aria-current={i === index ? "step" : undefined}
            onClick={() => change(i)} className={cn("h-9 w-9 shrink-0 rounded-full relative", i === index ? "bg-primary text-primary-foreground border-primary" : finished && "bg-forest/10 border-forest/40 text-forest")}>
            {i + 1}{finished && <CheckCircle2 className="absolute -right-1 -top-1 h-3.5 w-3.5 bg-cream rounded-full" />}
          </Button>;
        })}
      </nav>
      <div className="space-y-4">
        <header>
          <h3 className="font-display font-semibold text-xl text-primary">{scene.title}</h3>
        </header>
        <div className="flex flex-wrap items-center gap-2 border-y border-border/60 py-3">
          <Button size="sm" variant={playing ? "outline" : "hero"} onClick={() => playing ? stop() : play()}>
            {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}{playing ? "Stop" : "Slušaj"}
          </Button>
          {[{ r: 0.75, l: "0.75x lagano" }, { r: 1, l: "1x prirodno" }].map(o =>
            <Button key={o.r} size="sm" variant={rate === o.r ? "default" : "outline"} aria-pressed={rate === o.r} onClick={() => { stop(); setRate(o.r); }}>{o.l}</Button>)}
        </div>
        {q && <div className="space-y-3">
          <p className="font-medium text-primary">{q.prompt}</p>
          <div className="grid gap-2">
            {(options[scene.id]?.[step] || q.options).map(o => {
              const right = ans !== undefined && o === q.answer;
              const wrong = ans === o && o !== q.answer;
              return <Button key={o} variant="outline" disabled={ans !== undefined} onClick={() => select(o)}
                className={cn("h-auto min-h-11 w-full justify-start whitespace-normal break-words text-left px-4 py-2.5 rounded-lg disabled:opacity-100",
                  right ? "border-forest bg-forest/10" : wrong && "border-destructive bg-destructive/10")}>
                {o}
              </Button>;
            })}
          </div>
          {ans !== undefined && <div role="status" className="text-sm space-y-1">
            <p className="flex items-center gap-1.5 font-medium">{ans === q.answer ? <CheckCircle2 className="w-4 h-4 text-forest" /> : <XCircle className="w-4 h-4 text-destructive" />}{ans === q.answer ? "Tačno!" : "Netačno"}</p>
            {q.explanation && <p className="text-muted-foreground">{q.explanation}</p>}
          </div>}
          {scene.questions.length > 1 && <div className="flex justify-between gap-2">
            <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => { stop(); setQuestionSteps(previous => ({ ...previous, [scene.id]: step - 1 })); }}><ChevronLeft className="w-4 h-4" />Prethodno pitanje</Button>
            <Button size="sm" variant="outline" disabled={step === scene.questions.length - 1} onClick={() => { stop(); setQuestionSteps(previous => ({ ...previous, [scene.id]: step + 1 })); }}>Sledeće pitanje<ChevronRight className="w-4 h-4" /></Button>
          </div>}
        </div>}
        {done && <p className="text-sm font-medium text-primary">Rezultat: {correct} / {scene.questions.length}</p>}
        {ans !== undefined && <Button size="sm" variant="ghost" onClick={() => { stop(); setTranscripts(previous => ({ ...previous, [scene.id]: !previous[scene.id] })); }}>
          {transcripts[scene.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{transcripts[scene.id] ? "Sakrij transkript" : "Prikaži transkript"}
        </Button>}
        {ans !== undefined && transcripts[scene.id] && <ul className="space-y-2 border-t border-border/60 pt-3">
          {scene.lines.map((line, i) => <li key={i} className={cn("flex gap-2 items-start px-2 py-1 rounded-lg", active === i && "bg-secondary")}>
            <Button size="icon" variant="ghost" className="w-7 h-7 shrink-0" aria-label={`Pusti rečenicu ${i + 1}`} onClick={() => play([line])}><Volume2 className="w-4 h-4" /></Button>
            <p className="text-sm min-w-0"><strong className="text-primary">{line.speaker}:</strong> {line.text}</p>
          </li>)}
        </ul>}
      </div>
      <footer className="flex justify-between gap-2 border-t border-border/60 pt-4">
        <Button size="sm" variant="outline" disabled={index === 0} onClick={() => change(index - 1)}><ChevronLeft className="w-4 h-4" />Nazad</Button>
        {index < scenes.length - 1 ? <Button size="sm" variant="hero" onClick={() => change(index + 1)}>Dalje<ChevronRight className="w-4 h-4" /></Button>
          : <Button size="sm" variant="hero" onClick={() => { stop(); onFinish?.(); }}>Svi moduli</Button>}
      </footer>
    </section>
  );
}
