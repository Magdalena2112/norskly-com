import { useSavedState, useAnswerScope } from "@/lib/savedAnswers";
import { logErrors } from "@/lib/logErrors";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle2, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface ReviewQuestion { area: string; prompt: string; options: string[]; answer: string; explain?: string }
export interface ReviewQuiz { passScore?: number; bonusXp?: number; questions: ReviewQuestion[] }

const AREA: Record<string, string> = { grammar: "Gramatika", vocabulary: "Vokabular", communication: "Komunikacija" };

// Final mastery check: scored separately from lesson completion, with a one-time bonus on pass.
export default function LessonReviewQuiz({ quiz, lang, lessonCode, passed, onPass }: {
  quiz: ReviewQuiz; lang: "no" | "en" | "de"; lessonCode: string; passed: boolean; onPass: () => void;
}) {
  const { user } = useAuth();
  const scope = useAnswerScope();
  const pass = quiz.passScore ?? 8;
  const bestKey = `review_best_${lang}_${lessonCode}`;
  const [round, setRound] = useState(0);
  const [i, setI] = useSavedState(`rq:${lessonCode}:i`, 0);
  const [answers, setAnswers] = useSavedState<string[]>(`rq:${lessonCode}:answers`, []);
  const [best, setBest] = useState(() => Number(localStorage.getItem(bestKey) || 0));
  const opts = useMemo(() => quiz.questions.map((q) => [...q.options].sort(() => Math.random() - 0.5)), [quiz, round]);
  const total = quiz.questions.length;
  const finished = answers.length === total;
  const score = answers.filter((a, k) => a === quiz.questions[k].answer).length;

  async function choose(o: string) {
    if (answers.length > i) return;
    const question = quiz.questions[i];
    if (user && o !== question.answer) void logErrors(user.id, question.area === "vocabulary" ? "vocabulary" : "grammar", "lesson_review", [{
      category: question.area, topic: `${lessonCode} · Ponavljanje · ${i + 1}`,
      severity: 2, example_wrong: o, example_correct: question.answer,
    }], question.prompt, 1, lang, /^[0-9a-f-]{36}$/i.test(scope) ? scope : undefined);
    const next = [...answers, o];
    setAnswers(next);
    if (next.length < total) { setTimeout(() => setI(i + 1), 250); return; }
    const s = next.filter((a, k) => a === quiz.questions[k].answer).length;
    if (s > best) { setBest(s); localStorage.setItem(bestKey, String(s)); }
    // Review awards a trophy only (0 XP) so each lesson stays at exactly 100 XP.
    if (s >= pass && !passed && user) {
      toast.success("Bravo! Lekcija je uspešno završena.");
      onPass();
    }
  }

  const restart = () => { setRound(round + 1); setI(0); setAnswers([]); };

  if (finished) {
    const ok = score >= pass;
    return (
      <div className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft space-y-4">
        <div className="text-center space-y-2">
          <Trophy className={`w-12 h-12 mx-auto ${ok ? "text-sunset" : "text-muted-foreground/50"}`} />
          <p className="font-display text-3xl font-bold text-primary">{score}/{total}</p>
          <p className="text-sm text-muted-foreground">
            {ok ? "Bravo! Uspešno si završio/la ovu lekciju." : `Za završetak lekcije treba ti bar ${pass}/${total}. Pogledaj greške i pokušaj ponovo.`}
          </p>
        </div>
        <ul className="space-y-2">
          {quiz.questions.map((q, k) => answers[k] !== q.answer && (
            <li key={k} className="text-sm rounded-lg bg-background/70 p-3">
              <p className="font-medium">{k + 1}. {q.prompt}</p>
              <p className="text-destructive text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {answers[k]}</p>
              <p className="text-forest text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {q.answer}</p>
              {q.explain && <p className="text-xs text-muted-foreground mt-1">{q.explain}</p>}
            </li>
          ))}
        </ul>
        <Button variant="hero" onClick={restart}><RotateCcw className="w-4 h-4" /> Pokušaj ponovo</Button>
      </div>
    );
  }

  const q = quiz.questions[i];
  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-5 shadow-card-soft space-y-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Završna provera · posebno se boduje</span>
        <span className="flex items-center gap-1">
          {passed && <Trophy className="w-3.5 h-3.5 text-sunset" />} Najbolji rezultat: {best}/{total}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quiz.questions.map((_, k) => (
          <span key={k} className={`w-7 h-7 rounded-full text-xs font-semibold border flex items-center justify-center ${k === i ? "bg-primary text-primary-foreground border-primary" : k < answers.length ? "bg-primary/15 text-primary border-primary/30" : "bg-background border-border"}`}>{k + 1}</span>
        ))}
      </div>
      <span className="text-[11px] uppercase tracking-wide text-primary/50">{AREA[q.area] || q.area}</span>
      <p className="font-medium text-foreground">{q.prompt}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {opts[i].map((o) => (
          <button key={o} type="button" disabled={answers.length > i} onClick={() => choose(o)}
            className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${answers[i] === o ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"}`}>
            {o}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> Rezultat i objašnjenja vidiš na kraju.</p>
    </div>
  );
}
