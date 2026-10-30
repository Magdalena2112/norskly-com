import { useState } from "react";
import { ChevronDown, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLanguageCode } from "@/lib/currentLanguage";
import { getSelectedCourse } from "@/lib/courseSelection";

// v2: explanations follow the learner's chosen support style, so old neutral cache is skipped.
const KEY = "mistake-expl:v2:";

/** Explains the student's own mistake: diagnosis is generated from their actual answer, cached per device. */
export default function MistakeExplanation({ correct, explanation, yourAnswer, question }: {
  correct?: string; explanation?: string; yourAnswer?: string; question?: string;
}) {
  const [open, setOpen] = useState(false);
  const [diag, setDiag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (diag || loading || !yourAnswer?.trim() || !correct?.trim()) return;
    const k = KEY + [question, yourAnswer, correct].join("|").slice(0, 400);
    const cached = localStorage.getItem(k);
    if (cached) { setDiag(cached); return; }
    setLoading(true);
    const language = getCurrentLanguageCode();
    const { data } = await supabase.functions.invoke("mistake-explain", { body: { question: question || "", yourAnswer, correct, rule: explanation || "", language, course: getSelectedCourse(language) } });
    setLoading(false);
    if (data?.explanation) { setDiag(data.explanation); try { localStorage.setItem(k, data.explanation); } catch { /* full */ } }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 text-xs">
      <button type="button" onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-semibold text-primary">
        Objašnjenje greške <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
          {yourAnswer && <p>Tvoj odgovor: <span className="line-through text-destructive">{yourAnswer}</span></p>}
          {correct && <p>Tačan odgovor: <strong className="text-forest">{correct}</strong></p>}
          {loading && <p className="flex gap-1 text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analiziram tvoj odgovor…</p>}
          {diag && <p className="flex gap-1"><Lightbulb className="w-3.5 h-3.5 text-sunset shrink-0 mt-0.5" />{diag}</p>}
          {!loading && explanation && <p className="text-muted-foreground">{diag ? `Pravilo: ${explanation}` : explanation}</p>}
          {!loading && !diag && !explanation && <p>Uporedi svoj odgovor sa tačnim i obrati pažnju na pravilo iz gradiva ove lekcije.</p>}
        </div>
      )}
    </div>
  );
}
