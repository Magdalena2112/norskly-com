import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2, Volume2, BookText, Shuffle, MessageSquareQuote, Lightbulb, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { speakLines } from "@/lib/courseLessons";

interface Details { pos: string; forms: string[]; synonyms: string[]; antonyms: string[]; examples: { text: string; sr: string }[]; other_meanings: string[]; note: string }

const mem = new Map<string, Details>();
const keyOf = (l: string, w: string) => `wd:${l}:${w.toLowerCase()}`;

function Section({ icon: Icon, title, children }: { icon: typeof BookText; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2.5">
        <Icon className="w-4 h-4 text-accent" /> {title}
      </h4>
      {children}
    </section>
  );
}

const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((x) => <span key={x} className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs">{x}</span>)}
  </div>
);

export default function WordDetails({ word, translation, language }: { word: string; translation: string; language: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Details | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function openSheet() {
    setOpen(true);
    if (data || loading) return;
    const k = keyOf(language, word);
    const cached = mem.get(k) ?? (() => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) as Details : null; } catch { return null; } })();
    if (cached) { setData(cached); return; }
    setLoading(true); setErr("");
    const { data: d, error } = await supabase.functions.invoke("word-details", { body: { word, translation, language } });
    setLoading(false);
    if (error || !d || d.error) { setErr(d?.error ?? "Detalji trenutno nisu dostupni."); return; }
    mem.set(k, d); try { localStorage.setItem(k, JSON.stringify(d)); } catch { /* ignore */ }
    setData(d);
  }

  return (
    <>
      <button type="button" onClick={openSheet}
        className="mt-1.5 inline-flex items-center gap-0.5 text-xs text-primary/70 hover:text-primary">
        Više detalja <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-left pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <SheetTitle className="font-display text-2xl text-primary break-words">{word}</SheetTitle>
              <button onClick={() => speakLines([{ speaker: "f", text: word }], language)} aria-label={`Izgovori ${word}`}
                className="text-primary/60 hover:text-primary"><Volume2 className="w-5 h-5" /></button>
            </div>
            <SheetDescription className="text-base">{translation}</SheetDescription>
            {data?.pos && <span className="self-start rounded-full bg-accent/15 text-accent-foreground px-2.5 py-0.5 text-xs">{data.pos}</span>}
          </SheetHeader>

          <div className="space-y-3 pt-4 text-sm">
            {loading && <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Učitavam detalje…</p>}
            {err && <p className="text-destructive">{err}</p>}
            {data && <>
              {data.forms.length > 0 && (
                <Section icon={BookText} title="Gramatički oblici">
                  <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                    {data.forms.map((f) => {
                      const m = f.match(/^\s*([^:–—=]+?)\s*[:–—=]\s*(.+)$/) ?? f.match(/^\s*(.+?)\s*\(([^)]+)\)\s*$/);
                      const [form, label] = !m ? [f, ""] : f.includes("(") && !/[:–—=]/.test(f) ? [m[1], m[2]] : [m[2], m[1]];
                      return (
                        <div key={f} className="flex items-center gap-3 px-3 py-2 bg-background/40">
                          {label && <span className="w-28 shrink-0 text-xs text-muted-foreground leading-tight">{label}</span>}
                          <span className="flex-1 font-medium text-foreground break-words">{form}</span>
                          <button onClick={() => speakLines([{ speaker: "f", text: form }], language)} aria-label={`Izgovori ${form}`}
                            className="text-primary/60 hover:text-primary shrink-0"><Volume2 className="w-4 h-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
              {data.examples.length > 0 && (
                <Section icon={MessageSquareQuote} title="Primeri u rečenicama">
                  <ul className="space-y-2.5">
                    {data.examples.map((e) => (
                      <li key={e.text} className="flex gap-2">
                        <button onClick={() => speakLines([{ speaker: "f", text: e.text }], language)} aria-label="Poslušaj" className="text-primary/60 hover:text-primary shrink-0 mt-0.5"><Volume2 className="w-4 h-4" /></button>
                        <div><p className="italic text-foreground">{e.text}</p><p className="text-muted-foreground text-xs mt-0.5">{e.sr}</p></div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {(data.synonyms.length > 0 || data.antonyms.length > 0) && (
                <Section icon={Shuffle} title="Sinonimi i antonimi">
                  <div className="space-y-2.5">
                    {data.synonyms.length > 0 && <div><p className="text-xs text-muted-foreground mb-1">Sinonimi</p><Chips items={data.synonyms} /></div>}
                    {data.antonyms.length > 0 && <div><p className="text-xs text-muted-foreground mb-1">Antonimi</p><Chips items={data.antonyms} /></div>}
                  </div>
                </Section>
              )}
              {data.other_meanings.length > 0 && (
                <Section icon={Layers} title="Druga značenja">
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{data.other_meanings.map((x) => <li key={x}>{x}</li>)}</ul>
                </Section>
              )}
              {data.note && (
                <Section icon={Lightbulb} title="Savet za upotrebu"><p className="text-muted-foreground">{data.note}</p></Section>
              )}
            </>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
