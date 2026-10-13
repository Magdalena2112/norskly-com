import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { isCorrect, type Exercise } from "@/lib/courseLessons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logErrors } from "@/lib/logErrors";
import { toast } from "sonner";

type Status = "idle" | "correct" | "wrong" | "failed" | "partial" | "pending";
interface ItemState { value: string; attempts: number; status: Status; feedback?: string; improved?: string }

const MAX_ATTEMPTS = 3;

export default function LessonExercise({
  exercise, language, level, lessonTitle, done, onDone,
}: {
  exercise: Exercise; language: "no" | "en" | "de"; level: string; lessonTitle: string; done: boolean; onDone: (code: string) => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<ItemState[]>(() => exercise.items.map(() => ({ value: "", attempts: 0, status: "idle" })));
  const [checking, setChecking] = useState(false);

  const set = (i: number, patch: Partial<ItemState>) =>
    setState((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const finished = state.every((s, i) => exercise.items[i].open ? s.status !== "idle" && s.status !== "pending" : ["correct", "failed"].includes(s.status));

  async function check() {
    const next = [...state];
    const wrongs: { wrong: string; correct: string; prompt: string }[] = [];
    exercise.items.forEach((item, i) => {
      if (item.open) return;
      const s = next[i];
      if (s.status === "correct" || s.status === "failed") return;
      if (!s.value.trim()) return;
      if (isCorrect(s.value, item.answers)) next[i] = { ...s, status: "correct", attempts: s.attempts + 1 };
      else {
        const attempts = s.attempts + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        next[i] = { ...s, attempts, status: failed ? "failed" : "wrong" };
        if (failed) wrongs.push({ wrong: s.value, correct: item.answers?.[0] || "", prompt: item.prompt });
      }
    });
    setState(next);

    if (user && wrongs.length) {
      logErrors(user.id, "grammar", "lesson", wrongs.slice(0, 5).map((w) => ({
        category: exercise.code.startsWith("VO") ? "vocabulary" : "grammar",
        topic: `${exercise.code} · ${exercise.title}`,
        severity: 2,
        example_wrong: `${w.prompt} → ${w.wrong}`,
        example_correct: w.correct,
      })), lessonTitle, MAX_ATTEMPTS, language);
    }

    const openIdx = exercise.items.map((it, i) => (it.open && next[i].value.trim() && next[i].status !== "correct" ? i : -1)).filter((i) => i >= 0);
    if (openIdx.length) {
      setChecking(true);
      openIdx.forEach((i) => (next[i] = { ...next[i], status: "pending" }));
      setState([...next]);
      const { data, error } = await supabase.functions.invoke("lesson-check", {
        body: {
          language, level, lessonTitle,
          exercise: { code: exercise.code, title: exercise.title, instruction: exercise.instruction },
          items: openIdx.map((i) => ({ prompt: exercise.items[i].prompt, answer: next[i].value, guide: exercise.items[i].guide })),
        },
      });
      setChecking(false);
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json?.())?.error; } catch { /* noop */ }
        toast.error(msg || "AI provera nije uspela.");
        openIdx.forEach((i) => (next[i] = { ...next[i], status: "idle" }));
        setState([...next]);
        return;
      }
      (data.results || []).forEach((r: any) => {
        const i = openIdx[r.index];
        if (i === undefined) return;
        next[i] = { ...next[i], status: r.verdict === "correct" ? "correct" : r.verdict === "partial" ? "partial" : "wrong", feedback: r.feedback, improved: r.improved, attempts: next[i].attempts + 1 };
      });
      setState([...next]);
      if (user && data.errors?.length) logErrors(user.id, "writing", "lesson", data.errors, lessonTitle, undefined, language);
    }

    const allDone = next.every((s, i) => exercise.items[i].open ? ["correct", "partial", "wrong"].includes(s.status) : ["correct", "failed"].includes(s.status));
    if (allDone) onDone(exercise.code);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <span className="text-[11px] font-mono text-primary/50">{exercise.code}</span>
          <h4 className="font-display font-semibold text-primary leading-tight">{exercise.title}</h4>
        </div>
        {(done || finished) && <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{exercise.instruction}</p>
      <ol className="space-y-3">
        {exercise.items.map((item, i) => {
          const s = state[i];
          const locked = s.status === "correct" || s.status === "failed";
          return (
            <li key={i} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">{i + 1}. {item.prompt}</p>
              {item.options ? (
                <div className="flex flex-wrap gap-2">
                  {item.options.map((o) => (
                    <button key={o} type="button" disabled={locked}
                      onClick={() => set(i, { value: o, status: s.status === "wrong" ? "wrong" : "idle" })}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${s.value === o ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"} disabled:opacity-70`}>
                      {o}
                    </button>
                  ))}
                </div>
              ) : item.open ? (
                <Textarea value={s.value} disabled={s.status === "pending"} rows={2}
                  onChange={(e) => set(i, { value: e.target.value })} placeholder="Tvoj odgovor…" className="bg-background" />
              ) : (
                <Input value={s.value} disabled={locked} onChange={(e) => set(i, { value: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && check()} placeholder="Tvoj odgovor…" className="bg-background max-w-md" />
              )}
              {s.status === "correct" && <p className="text-xs text-forest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Tačno!{s.feedback ? ` ${s.feedback}` : ""}</p>}
              {s.status === "wrong" && !item.open && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Nije tačno. Pokušaj ponovo ({MAX_ATTEMPTS - s.attempts} preostala).</p>}
              {s.status === "failed" && <p className="text-xs text-destructive flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Tačan odgovor: <strong>{item.answers?.[0]}</strong></p>}
              {item.open && (s.status === "partial" || s.status === "wrong") && (
                <div className="text-xs rounded-lg bg-secondary/50 p-2 space-y-1">
                  <p className="flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 mt-0.5 text-sunset shrink-0" /> {s.feedback}</p>
                  {s.improved && <p className="italic text-primary">→ {s.improved}</p>}
                </div>
              )}
              {s.status === "pending" && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI tutor proverava…</p>}
            </li>
          );
        })}
      </ol>
      <Button size="sm" variant="hero" className="mt-4" onClick={check} disabled={checking}>
        {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : exercise.items.some((x) => x.open) ? <Sparkles className="w-4 h-4" /> : null}
        Proveri
      </Button>
    </div>
  );
}
