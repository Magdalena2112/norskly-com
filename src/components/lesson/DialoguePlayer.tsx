import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Users, User, Turtle, Eye, EyeOff } from "lucide-react";
import { speakLines, stopSpeaking, speakerCount, type DialogueLine } from "@/lib/courseLessons";
import InteractiveText from "@/components/lesson/InteractiveText";
import type { LessonWord } from "@/lib/myDictionary";

const COLORS = ["bg-primary/10 text-primary", "bg-fjord/15 text-fjord", "bg-sunset/15 text-sunset", "bg-forest/15 text-forest", "bg-accent/15 text-accent"];

export default function DialoguePlayer({
  title, scene, lines, language, hideTranscript = false, interactive,
}: { title: string; scene?: string; lines: DialogueLine[]; language: string; hideTranscript?: boolean; interactive?: { known: LessonWord[]; lessonCode?: string } }) {
  const [active, setActive] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [show, setShow] = useState(!hideTranscript);
  const speakers = Array.from(new Set(lines.map((l) => l.speaker)));
  const count = speakerCount(lines);

  useEffect(() => () => stopSpeaking(), []);

  const play = () => {
    setPlaying(true);
    speakLines(lines, language, { slow, onLine: setActive, onEnd: () => { setPlaying(false); setActive(null); setShow(true); } });
  };
  const stop = () => { stopSpeaking(); setPlaying(false); setActive(null); };

  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-display font-semibold text-primary">{title}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            {count > 1 ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            {count > 1 ? `Dijalog · ${count} govornika (${speakers.join(", ")})` : "Jedan govornik"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={slow ? "default" : "outline"} onClick={() => setSlow(!slow)} title="Sporije">
            <Turtle className="w-4 h-4" />
          </Button>
          {playing ? (
            <Button size="sm" variant="outline" onClick={stop}><Square className="w-4 h-4" /> Stop</Button>
          ) : (
            <Button size="sm" variant="hero" onClick={play}><Play className="w-4 h-4" /> Slušaj</Button>
          )}
        </div>
      </div>
      {scene && <p className="text-sm italic text-primary/70 mb-3">{scene}</p>}
      {hideTranscript && (
        <button className="text-xs text-primary/70 flex items-center gap-1 mb-2" onClick={() => setShow(!show)}>
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? "Sakrij transkript" : "Prikaži transkript"}
        </button>
      )}
      {show && (
        <ul className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={i} className={`flex gap-2 rounded-lg px-2 py-1 transition-colors ${active === i ? "bg-secondary" : ""}`}>
              {count > 1 && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full h-fit whitespace-nowrap ${COLORS[[...l.speaker].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length]}`}>{l.speaker}</span>
              )}
              <span className="text-sm text-foreground">{interactive ? <InteractiveText text={l.text} language={language} known={interactive.known} lessonCode={interactive.lessonCode} /> : l.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
