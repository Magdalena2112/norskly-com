import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Volume2, ChevronDown, Trash2 } from "lucide-react";

// ─── Types ───
export interface GrammarForms {
  [key: string]: string | undefined;
}

export interface VocabWordData {
  word: string;
  translation: string;
  word_type?: string | null;
  synonym?: string | null;
  antonym?: string | null;
  example_sentence?: string | null;
  examples?: string[];
  grammar_forms?: GrammarForms | null;
}

// ─── Word type display mapping ───
const WORD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  imenica: { label: "imenica", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  glagol: { label: "glagol", color: "bg-green-500/15 text-green-700 dark:text-green-300" },
  pridev: { label: "pridev", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  prilog: { label: "prilog", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  zamenica: { label: "zamenica", color: "bg-pink-500/15 text-pink-700 dark:text-pink-300" },
  predlog: { label: "predlog", color: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  veznik: { label: "veznik", color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  broj: { label: "broj", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300" },
  uzvik: { label: "uzvik", color: "bg-red-500/15 text-red-700 dark:text-red-300" },
  izraz: { label: "izraz", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  fraza: { label: "fraza", color: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  "pomoćni glagol": { label: "pomoćni glagol", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  "modalni glagol": { label: "modalni glagol", color: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" },
  "nepravilni glagol": { label: "nepravilni glagol", color: "bg-lime-500/15 text-lime-700 dark:text-lime-300" },
};

// ─── Grammar field labels ───
const GRAMMAR_FIELD_LABELS: Record<string, string> = {
  // Nouns
  ubestemt_entall: "Neodređeni jednina",
  bestemt_entall: "Određeni jednina",
  ubestemt_flertall: "Neodređeni množina",
  bestemt_flertall: "Određeni množina",
  kjonn: "Rod",
  // Verbs
  infinitiv: "Infinitiv",
  presens: "Prezent",
  preteritum: "Preterit",
  perfektum: "Perfekt",
  // Adjectives
  grunnform: "Osnovni oblik",
  intetkjonn: "Srednji rod",
  flertall_bestemt: "Množina / Određeni",
  komparativ: "Komparativ",
  superlativ: "Superlativ",
  // Adverbs
  // (grunnform reused)
  // Pronouns
  subjektform: "Subjektski oblik",
  objektform: "Objektski oblik",
  eiendomsform: "Posvojni oblik",
  refleksiv: "Refleksivni oblik",
  // General
  bruksmonster: "Tipična upotreba",
  funksjon: "Funkcija",
  grunntall: "Osnovni broj",
  rekkefolgetal: "Redni broj",
  bruksnotat: "Napomena",
};

function getFieldLabel(key: string): string {
  return GRAMMAR_FIELD_LABELS[key] || key.replace(/_/g, " ");
}

// ─── TTS helper ───
function speakNorwegian(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "nb-NO";
  utter.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const nbVoice = voices.find((v) => v.lang.startsWith("nb") || v.lang.startsWith("no"));
  if (nbVoice) utter.voice = nbVoice;
  window.speechSynthesis.speak(utter);
}

interface VocabWordCardProps {
  data: VocabWordData;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function VocabWordCard({ data, onRemove, showRemove }: VocabWordCardProps) {
  const [grammarOpen, setGrammarOpen] = useState(false);

  const wordType = data.word_type?.toLowerCase()?.trim() || null;
  const typeInfo = wordType ? (WORD_TYPE_LABELS[wordType] || { label: wordType, color: "bg-muted text-muted-foreground" }) : null;

  const grammarForms = data.grammar_forms;
  const hasGrammar = grammarForms && Object.keys(grammarForms).length > 0;

  // Filter out empty/null values
  const grammarEntries = hasGrammar
    ? Object.entries(grammarForms!).filter(([, v]) => v != null && v !== "")
    : [];

  const examples = data.examples?.length ? data.examples : data.example_sentence ? [data.example_sentence] : [];

  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-2">
        {/* Header: word, type badge, audio, remove */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xl font-display font-bold text-foreground">
                {data.word}
                <span className="text-base font-normal text-muted-foreground ml-2">— {data.translation}</span>
              </p>
              {typeInfo && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              )}
              {wordType === "imenica" && grammarForms?.kjonn && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
                  {String(grammarForms.kjonn)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => speakNorwegian(data.word)} title="Izgovor">
              <Volume2 className="w-4 h-4 text-accent" />
            </Button>
            {showRemove && onRemove && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Synonym / Antonym chips */}
        {(data.synonym || data.antonym) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {data.synonym && (
              <span className="bg-accent/10 text-accent px-2 py-1 rounded-full">Sinonim: {data.synonym}</span>
            )}
            {data.antonym && (
              <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-full">Antonim: {data.antonym}</span>
            )}
          </div>
        )}

        {/* Example sentences */}
        {examples.map((ex, j) => (
          <p key={j} className="text-sm text-muted-foreground italic">"{ex}"</p>
        ))}

        {/* Collapsible grammar section */}
        {grammarEntries.length > 0 && (
          <Collapsible open={grammarOpen} onOpenChange={setGrammarOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors mt-1 group">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${grammarOpen ? "rotate-180" : ""}`} />
                {grammarOpen ? "Sakrij oblike" : "Gramatički oblici"}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 bg-muted/50 rounded-lg p-3 space-y-1.5">
                {grammarEntries.map(([key, value]) => (
                  <div key={key} className="flex items-baseline gap-2 text-xs">
                    <span className="text-muted-foreground font-medium min-w-[120px] shrink-0">
                      {getFieldLabel(key)}
                    </span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
