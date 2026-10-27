import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, Volume2 } from "lucide-react";
import { isCorrect, speakLines, type Exercise } from "@/lib/courseLessons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { logErrors } from "@/lib/logErrors";
import { toast } from "sonner";
import { ITEM_IMAGES } from "@/content/lessons/itemImages";
import CorrectionResultView, { type CorrectionResult } from "@/components/writing/CorrectionResultView";

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
  const [analysis, setAnalysis] = useState<CorrectionResult | null>(null);
  // Shuffle options once per exercise so the correct answer's position doesn't give it away.
  const shuffledOptions = useMemo(
    () => exercise.items.map((it) => (it.options ? [...it.options].sort(() => Math.random() - 0.5) : undefined)),
    [exercise]
  );

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
        category: /^(VO|GI|PCF|CO|NUM)-/.test(exercise.code) ? "vocabulary" : "grammar",
        topic: `${exercise.code} · ${exercise.title}`,
        severity: 2,
        example_wrong: `${w.prompt} → ${w.wrong}`,
        example_correct: w.correct,
      })), lessonTitle, MAX_ATTEMPTS, language);
    }

    // Explicitly open writing tasks get the full analysis, same as free writing.
    if (isWriting) {
      const s = next[0];
      if (!s.value.trim() || s.status === "correct") { setState(next); return; }
      setChecking(true);
      next[0] = { ...s, status: "pending" };
      setState([...next]);
      const { data, error } = await supabase.functions.invoke("writing-correct", {
        body: {
          text: s.value.trim(),
          level,
          language,
          has_image: !!exercise.image,
          topic: { title: exercise.title, guiding_questions: exercise.items[0].guiding || [] },
        },
      });
      setChecking(false);
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json?.())?.error; } catch { /* noop */ }
        toast.error(msg || "Provera odgovora nije uspela.");
        next[0] = { ...next[0], status: "idle" };
        setState([...next]);
        return;
      }
      setAnalysis(data as CorrectionResult);
      const mistakeCount = (data.mistakes || []).length;
      next[0] = { ...next[0], status: mistakeCount === 0 ? "correct" : "partial", feedback: data.overall_feedback, improved: data.corrected_text, attempts: next[0].attempts + 1 };
      setState([...next]);
      if (user && data._errors?.length) logErrors(user.id, "writing", "lesson", data._errors.slice(0, 5), lessonTitle, undefined, language);
      onDone(exercise.code);
      return;
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
        toast.error(msg || "Provera odgovora nije uspela.");
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

  // Shape alone is not enough: short comprehension questions can also have one open item.
  const isWriting = exercise.kind === "open" && exercise.items.length === 1 && !!exercise.items[0].open;
  if (!isWriting) return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <span className="text-[11px] font-mono text-primary/50">{exercise.code}</span>
          <h4 className="font-display font-semibold text-primary leading-tight">{exercise.title}</h4>
        </div>
        {(done || finished) && <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />}
      </div>
      {exercise.image && ITEM_IMAGES[exercise.image] && <img src={ITEM_IMAGES[exercise.image]} alt={exercise.title} loading="lazy" className="w-full max-w-sm h-auto rounded-xl border border-border/60 mb-3" />}
      <p className="text-sm text-muted-foreground mb-4">{exercise.instruction}</p>
      <ol className={exercise.items.some((x) => x.image) ? "grid sm:grid-cols-2 gap-4" : "space-y-3"}>
        {exercise.items.map((item, i) => {
          const s = state[i];
          const locked = s.status === "correct" || s.status === "failed";
          const img = item.image ? ITEM_IMAGES[item.image] : undefined;
          return (
            <li key={i} className={img ? "rounded-2xl border border-border/60 bg-background/70 p-3 space-y-2" : "space-y-1.5"}>
              {img && <img src={img} alt={`Slika ${i + 1}`} loading="lazy" className="w-full h-auto aspect-square object-contain rounded-xl bg-cream" />}
              {item.audio ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{i + 1}.</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => speakLines([{ speaker: "m", text: item.audio! }], language)}>
                    <Volume2 className="w-4 h-4 mr-1" /> Poslušaj
                  </Button>
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground">{i + 1}. {item.prompt}</p>
              )}
              {item.options ? (
                <div className="flex flex-wrap gap-2">
                  {(shuffledOptions[i] || item.options).map((o) => (
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
              {s.status === "pending" && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Provera odgovora…</p>}
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

  // ── Writing layout: image left, instruction + guiding questions + answer right ──
  const wItem = exercise.items[0];
  const wState = state[0];
  const wImg = exercise.image ? ITEM_IMAGES[exercise.image] : undefined;
  const wTarget = exercise.instruction.match(/(\d+)\s*[–-]\s*(\d+)/);
  const words = wState.value.trim() ? wState.value.trim().split(/\s+/).length : 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-[11px] font-mono text-primary/50">{exercise.code}</span>
          <h4 className="font-display font-semibold text-primary leading-tight">{exercise.title}</h4>
        </div>
        {(done || finished) && <CheckCircle2 className="w-5 h-5 text-forest shrink-0" />}
      </div>
      <div className={wImg ? "grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start" : "space-y-3"}>
        {wImg && (
          <img src={wImg} alt={exercise.title} loading="lazy"
            className="w-full h-auto object-contain rounded-xl border border-border/60 bg-background" />
        )}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{exercise.instruction}</p>
          {wItem.guiding?.length ? (
            <div className="rounded-xl border border-border/50 bg-secondary/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70 mb-1.5">Pitanja vodilje</p>
              <ul className="space-y-1 text-sm text-foreground/90">
                {wItem.guiding.map((q, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary/60 shrink-0">•</span><span>{q}</span></li>
                ))}
              </ul>
            </div>
          ) : null}
          <Textarea value={wState.value} disabled={wState.status === "pending"} rows={8}
            onChange={(e) => set(0, { value: e.target.value })} placeholder="Tvoj odgovor…" className="bg-background resize-y" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{words} reči{wTarget ? ` · cilj ${wTarget[1]}–${wTarget[2]}` : ""}</span>
          </div>
          {wState.status === "correct" && !analysis && <p className="text-xs text-forest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Tačno!{wState.feedback ? ` ${wState.feedback}` : ""}</p>}
          {wState.status === "pending" && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analiza teksta…</p>}
          <div>
            <Button size="sm" variant="hero" onClick={check} disabled={checking || wState.status === "pending"}>
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analysis ? "Proveri ponovo" : "Proveri"}
            </Button>
          </div>
          {analysis && <CorrectionResultView result={analysis} />}
        </div>
      </div>
    </div>
  );
}
