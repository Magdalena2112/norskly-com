import { useSavedState } from "@/lib/savedAnswers";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, RotateCcw, Lightbulb } from "lucide-react";
import { gradePractice, type PracticeExercise } from "@/lib/grammarPractice";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function GrammarPracticeExercise({ exercise: ex, done, onDone, images, vocabulary = false }: {
  exercise: PracticeExercise; done: boolean; onDone: (code: string) => void;
  images?: { prompt?: string; left?: (string | undefined)[] }; vocabulary?: boolean;
}) {
  const [attempt, setAttempt] = useSavedState(`gp:${ex.code}:attempt`, 0);
  const [result, setResult] = useSavedState<"idle" | "correct" | "wrong">(`gp:${ex.code}:result`, "idle");
  const [seed, setSeed] = useState(0);
  const [awarded, setAwarded] = useState(false);
  const optOrder = useMemo(() => shuffle((ex.options || []).map((_, i) => i)), [ex, seed]);
  const rightOrder = useMemo(() => shuffle((ex.right || []).map((_, i) => i)), [ex]);
  const tokenOrder = useMemo(() => shuffle((ex.tokens || []).map((_, i) => i)), [ex]);
  const gapOpts = useMemo(() => (ex.gaps || []).map((g) => shuffle(g.options)), [ex]);

  const [picked, setPicked] = useSavedState<number[]>(`gp:${ex.code}:picked`, []);
  const [placed, setPlaced] = useSavedState<number[]>(`gp:${ex.code}:placed`, []); // token indices in answer order
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [gapVals, setGapVals] = useSavedState<string[]>(`gp:${ex.code}:gaps`, () => (ex.gaps || []).map(() => ""));
  const [texts, setTexts] = useSavedState<string[]>(`gp:${ex.code}:texts`, () => (ex.inputs || []).map(() => ""));
  const [matches, setMatches] = useSavedState<number[]>(`gp:${ex.code}:matches`, () => (ex.left || []).map(() => -1));
  const [activeLeft, setActiveLeft] = useState<number | null>(null);

  const locked = result === "correct";
  const touch = () => result === "wrong" && setResult("idle");

  const value = (): number[] | string[] => {
    switch (ex.type) {
      case "order": return placed.map((i) => ex.tokens?.[i] ?? "");
      case "gaps": return gapVals;
      case "text": return texts;
      case "match": return matches;
      default: return picked;
    }
  };
  const ready = (() => {
    switch (ex.type) {
      case "order": return placed.length === (ex.tokens || []).length;
      case "gaps": return gapVals.every(Boolean);
      case "text": return texts.every((t) => t.trim());
      case "match": return matches.every((m) => m >= 0);
      case "multi": return picked.length > 0;
      default: return picked.length === 1;
    }
  })();

  function check() {
    if (!ready || locked) return;
    const ok = gradePractice(ex, value());
    setAttempt((a) => a + 1);
    if (ok) {
      setResult("correct");
      if (!done) setAwarded(true);
      onDone(ex.code);
    } else {
      setResult("wrong");
      setSeed((s) => s + 1); // reshuffle options between attempts
    }
  }

  function reset() {
    setPicked([]); setPlaced([]); setGapVals((ex.gaps || []).map(() => "")); setTexts((ex.inputs || []).map(() => ""));
    setMatches((ex.left || []).map(() => -1)); setActiveLeft(null); setResult("idle");
  }

  function dropAt(target: number) {
    if (dragFrom === null || dragFrom === target) return;
    const next = [...placed]; const [m] = next.splice(dragFrom, 1); next.splice(target, 0, m);
    setPlaced(next); setDragFrom(null); touch();
  }

  const chip = (active: boolean) =>
    `px-3 py-2 rounded-xl text-sm border text-left transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"} disabled:opacity-70`;

  const gapParts = (ex.text || "").split("___");

  return (
    <div className="rounded-2xl border border-border/60 bg-cream/90 p-4 sm:p-5 shadow-card-soft space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[11px] font-mono text-primary/50">{ex.code}</span>
          <h4 className="font-display font-semibold text-primary leading-tight">{ex.title}</h4>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold rounded-full bg-secondary px-2 py-0.5 text-primary">{ex.xp} XP</span>
          {(done || locked) && <CheckCircle2 className="w-5 h-5 text-forest" />}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{ex.instruction}</p>
      {ex.context && <div className="rounded-xl bg-secondary/40 border border-border/50 p-3 text-sm whitespace-pre-line">{ex.context}</div>}
      {ex.prompt && <p className="text-sm font-medium text-foreground">{ex.prompt}</p>}
      {images?.prompt && <img src={images.prompt} alt="Ilustracija zadatka" className="w-full max-w-xs mx-auto aspect-[4/3] object-contain rounded-lg bg-background" />}

      {(ex.type === "choice" || ex.type === "truefalse" || ex.type === "multi") && (
        <div className="grid gap-2">
          {optOrder.map((i) => (
            <Button key={i} type="button" variant="outline" disabled={locked} className={`${chip(picked.includes(i))} h-auto whitespace-normal justify-start`}
              onClick={() => { touch(); setPicked(ex.type === "multi" ? (picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i]) : [i]); }}>
              {ex.options?.[i]}
            </Button>
          ))}
          {ex.type === "multi" && <p className="text-xs text-muted-foreground">Izaberi tačno {ex.correct?.length} odgovora.</p>}
        </div>
      )}

      {ex.type === "order" && (
        <div className="space-y-3">
          <div className="min-h-[52px] rounded-xl border-2 border-dashed border-primary/30 bg-background/70 p-2 flex flex-wrap gap-2" aria-label="Tvoja rečenica">
            {placed.length === 0 && <span className="text-xs text-muted-foreground self-center px-1">Klikni na delove ispod redom. Prevuci ih da promeniš redosled.</span>}
            {placed.map((ti, pos) => (
              <button key={ti} type="button" disabled={locked} draggable={!locked}
                onDragStart={() => setDragFrom(pos)} onDragOver={(e) => e.preventDefault()} onDrop={() => dropAt(pos)}
                onClick={() => { setPlaced(placed.filter((_, j) => j !== pos)); touch(); }}
                className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground cursor-grab" aria-label={`Ukloni ${ex.tokens?.[ti]}`}>
                {ex.tokens?.[ti]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {tokenOrder.filter((ti) => !placed.includes(ti)).map((ti) => (
              <button key={ti} type="button" disabled={locked} onClick={() => { setPlaced([...placed, ti]); touch(); }}
                className="px-3 py-1.5 rounded-lg text-sm border border-border bg-background hover:border-primary/50">
                {ex.tokens?.[ti]}
              </button>
            ))}
          </div>
        </div>
      )}

      {ex.type === "gaps" && (
        <div className="text-sm leading-9 whitespace-pre-line rounded-xl bg-background/70 p-3">
          {gapParts.map((part, i) => (
            <span key={i}>{part}{i < gapParts.length - 1 && (
              <select value={gapVals[i]} disabled={locked} aria-label={`Praznina ${i + 1}`}
                onChange={(e) => { const n = [...gapVals]; n[i] = e.target.value; setGapVals(n); touch(); }}
                className="mx-1 rounded-lg border border-border bg-cream px-2 py-1 text-sm font-medium text-primary">
                <option value="">…</option>
                {gapOpts[i].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}</span>
          ))}
        </div>
      )}

      {ex.type === "text" && (
        <div className="space-y-3">
          {(ex.inputs ?? []).map((inp, i) => (
            <div key={i} className="space-y-1">
              {vocabulary || (ex.inputs?.length ?? 0) > 1 || !ex.context ? <p className="text-sm text-foreground/80">{inp.prompt}</p> : null}
              <Input value={texts[i]} disabled={locked} placeholder={vocabulary ? "Tvoj odgovor…" : "Napiši ispravnu rečenicu…"} className="bg-background"
                onChange={(e) => { const n = [...texts]; n[i] = e.target.value; setTexts(n); touch(); }}
                onKeyDown={(e) => e.key === "Enter" && check()} />
            </div>
          ))}
        </div>
      )}

      {ex.type === "match" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            {(ex.left ?? []).map((q, i) => (
              <Button key={i} type="button" variant="outline" disabled={locked} onClick={() => setActiveLeft(i)}
                aria-label={images?.left?.[i] ? `Slika ${i + 1}` : q}
                className={`${chip(activeLeft === i)} w-full h-auto whitespace-normal flex justify-between gap-2`}>
                <span className="min-w-0 text-left">{images?.left?.[i] && <img src={images.left[i]} alt={`Ilustracija ${i + 1}`} className="w-full max-w-[160px] aspect-[4/3] object-contain rounded-lg bg-background mb-1" />}{i + 1}. {q}</span>
                {matches[i] >= 0 && <span className="font-semibold shrink-0">→ {String.fromCharCode(65 + rightOrder.indexOf(matches[i]))}</span>}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {rightOrder.map((ri, k) => (
              <Button key={ri} type="button" variant="outline" disabled={locked || activeLeft === null}
                onClick={() => { if (activeLeft === null) return; const n = matches.map((m) => (m === ri ? -1 : m)); n[activeLeft] = ri; setMatches(n); setActiveLeft(null); touch(); }}
                className={`${chip(matches.includes(ri))} w-full h-auto whitespace-normal justify-start`}>
                {String.fromCharCode(65 + k)}. {ex.right?.[ri]}
              </Button>
            ))}
            <p className="text-xs text-muted-foreground">{vocabulary ? "Izaberi stavku levo, pa njen par desno." : "Izaberi pitanje levo, pa odgovor desno."}</p>
          </div>
        </div>
      )}

      {result === "correct" && (
        <div className="rounded-xl bg-forest/10 border border-forest/30 p-3 text-sm space-y-1 animate-fade-in">
          <p className="font-semibold text-forest flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Tačno!{awarded && (!vocabulary || done) ? ` +${ex.xp} XP` : ""}</p>
          {ex.explanation && <p>{ex.explanation}</p>}
        </div>
      )}
      {result === "wrong" && (
        <div className="rounded-xl bg-secondary/60 border border-border p-3 text-sm space-y-1">
          <p className="font-semibold text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Pokušaj ponovo.</p>
          <p className="flex gap-1"><Lightbulb className="w-4 h-4 text-sunset shrink-0 mt-0.5" /> {attempt >= 2 && ex.hint2 ? ex.hint2 : ex.hint}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="hero" onClick={check} disabled={!ready || locked}>Proveri odgovor</Button>
        {!locked && <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4" /> Resetuj</Button>}
        {locked && <Button size="sm" variant="outline" onClick={() => { reset(); setAttempt(0); setAwarded(false); }}>Vežbaj ponovo</Button>}
      </div>
    </div>
  );
}
