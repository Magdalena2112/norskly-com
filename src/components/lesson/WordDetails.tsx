import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Loader2 } from "lucide-react";

interface Details { pos: string; forms: string[]; synonyms: string[]; antonyms: string[]; examples: { text: string; sr: string }[]; other_meanings: string[]; note: string }

const mem = new Map<string, Details>();
const keyOf = (l: string, w: string) => `wd:${l}:${w.toLowerCase()}`;

export default function WordDetails({ word, translation, language }: { word: string; translation: string; language: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Details | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !open; setOpen(next);
    if (!next || data || loading) return;
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

  const List = ({ label, items }: { label: string; items: string[] }) => items.length ? (
    <div><p className="font-medium text-primary">{label}</p><ul className="list-disc pl-4 text-muted-foreground">{items.map((x) => <li key={x}>{x}</li>)}</ul></div>
  ) : null;

  return (
    <div className="mt-1.5">
      <button type="button" onClick={toggle} aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary">
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} /> Više detalja
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-xs rounded-lg bg-muted/40 p-2.5">
          {loading && <p className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Učitavam…</p>}
          {err && <p className="text-destructive">{err}</p>}
          {data && <>
            {data.pos && <p><span className="font-medium text-primary">Vrsta reči:</span> <span className="text-muted-foreground">{data.pos}</span></p>}
            <List label="Gramatički oblici" items={data.forms} />
            <List label="Sinonimi" items={data.synonyms} />
            <List label="Antonimi" items={data.antonyms} />
            {data.examples.length > 0 && <div><p className="font-medium text-primary">Primeri</p><ul className="space-y-1">{data.examples.map((e) => <li key={e.text}><span className="italic text-primary/80">{e.text}</span><br /><span className="text-muted-foreground">{e.sr}</span></li>)}</ul></div>}
            <List label="Druga značenja" items={data.other_meanings} />
            {data.note && <p className="text-muted-foreground"><span className="font-medium text-primary">Savet:</span> {data.note}</p>}
          </>}
        </div>
      )}
    </div>
  );
}
