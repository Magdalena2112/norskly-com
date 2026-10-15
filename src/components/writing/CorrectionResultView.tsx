import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export interface Mistake { original: string; corrected: string; explanation: string; }
export interface VocabSuggestion { weak: string; better: string; why: string; }
export interface CorrectionResult {
  corrected_text: string;
  mistakes: Mistake[];
  vocabulary_suggestions?: VocabSuggestion[];
  overall_feedback?: string;
  naturalness_score?: number;
  complexity_score?: number;
  nivo_analiza?: Record<string, string>;
  cefr_assessment?: string;
  sledeci_korak?: string[];
  _errors?: { category: string; topic: string; severity: number; example_wrong: string; example_correct: string }[];
}

export default function CorrectionResultView({ result, onPdf }: { result: CorrectionResult; onPdf?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
      <div className="rounded-2xl bg-secondary/40 border border-border/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Ispravljena verzija</p>
          {onPdf && (
            <Button size="sm" variant="outline" onClick={onPdf}>
              <FileDown className="w-3.5 h-3.5 mr-1" /> Preuzmi PDF analizu
            </Button>
          )}
        </div>
        <p className="text-foreground leading-relaxed">{result.corrected_text}</p>
      </div>

      {result.mistakes && result.mistakes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Greške ({result.mistakes.length})</p>
          {result.mistakes.map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-cream border border-border/40">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-destructive line-through">{m.original}</span>
                <span className="text-primary font-medium">→ {m.corrected}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{m.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {result.vocabulary_suggestions && result.vocabulary_suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Predlozi vokabulara</p>
          {result.vocabulary_suggestions.map((v, i) => (
            <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-sm">
              <div><span className="line-through text-muted-foreground">{v.weak}</span> <span className="text-primary font-medium">→ {v.better}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{v.why}</p>
            </div>
          ))}
        </div>
      )}

      {result.overall_feedback && (
        <div className="p-4 rounded-2xl bg-accent/20 border border-accent/40 text-sm text-foreground">
          {result.overall_feedback}
        </div>
      )}

      {result.nivo_analiza && (
        <div className="rounded-2xl bg-cream border border-border/40 p-4 space-y-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">Nivo analiza</p>
          {Object.entries(result.nivo_analiza).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-medium min-w-[100px] capitalize">{k}:</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      {result.cefr_assessment && (
        <p className="text-xs text-muted-foreground">Procena nivoa teksta: <span className="font-medium text-primary">{result.cefr_assessment}</span></p>
      )}

      {result.sledeci_korak && result.sledeci_korak.length > 0 && (
        <div className="rounded-2xl bg-secondary/40 border border-border/40 p-4 text-sm space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">Sledeći koraci</p>
          {result.sledeci_korak.map((s, i) => (
            <div key={i} className="flex gap-2"><span className="text-primary font-bold">{i + 1}.</span><span>{s}</span></div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
