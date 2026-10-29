import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";

export default function MistakeExplanation({ correct, explanation, yourAnswer }: { correct?: string; explanation?: string; yourAnswer?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 text-xs">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 font-semibold text-primary">
        Objašnjenje greške <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5 animate-fade-in">
          {yourAnswer && <p>Tvoj odgovor: <span className="line-through text-destructive">{yourAnswer}</span></p>}
          {correct && <p>Tačan odgovor: <strong className="text-forest">{correct}</strong></p>}
          <p className="flex gap-1"><Lightbulb className="w-3.5 h-3.5 text-sunset shrink-0 mt-0.5" />
            {explanation || "Uporedi svoj odgovor sa tačnim i obrati pažnju na pravilo iz gradiva ove lekcije (oblik reči, red reči i značenje u kontekstu)."}</p>
        </div>
      )}
    </div>
  );
}
