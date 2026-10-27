import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Check, Loader2, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { saveToMyDictionary, type LessonWord } from "@/lib/myDictionary";
import { speakLines } from "@/lib/courseLessons";
import { toast } from "sonner";

interface Info { lemma: string; translation: string; pos?: string; example?: string; example_sr?: string }
const cache = new Map<string, Info>();

function WordPop({ word, sentence, language, known, lessonCode }: { word: string; sentence: string; language: string; known?: LessonWord; lessonCode?: string }) {
  const { user } = useAuth();
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const key = `${language}:${word.toLowerCase()}:${sentence}`;

  const load = async () => {
    if (info) return;
    if (cache.has(key)) return setInfo(cache.get(key)!);
    setErr("");
    const { data, error } = await supabase.functions.invoke("word-lookup", { body: { word, sentence, language } });
    if (error || data?.error) { if (known) setInfo({ lemma: known.word, translation: known.translation }); else setErr(data?.error || "Prevod trenutno nije dostupan."); return; }
    cache.set(key, data); setInfo(data);
  };

  const save = async () => {
    if (!user || !info) return;
    setSaving(true);
    try {
      await saveToMyDictionary(user.id, language, { word: info.lemma || word, translation: info.translation, example: info.example, pos: info.pos, topic: lessonCode });
      setSaved(true); toast.success("Sačuvano u „Moj rečnik”");
    } catch { toast.error("Čuvanje nije uspelo."); } finally { setSaving(false); }
  };

  return (
    <Popover onOpenChange={(o) => o && load()}>
      <PopoverTrigger asChild>
        <span role="button" tabIndex={0} className={`cursor-pointer rounded px-0.5 -mx-0.5 hover:bg-primary/10 ${known ? "underline decoration-dotted decoration-primary/50 underline-offset-4" : ""}`}>{word}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm" side="top">
        {!info && !err && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Tražim značenje…</div>}
        {err && <p className="text-destructive">{err}</p>}
        {info && (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display font-semibold text-primary">{info.lemma}</p>
                {info.pos && <p className="text-[11px] text-muted-foreground">{info.pos}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Slušaj" onClick={() => speakLines([{ speaker: "A", text: info.lemma }], language, {})}><Volume2 className="w-4 h-4" /></Button>
            </div>
            <p>{info.translation}</p>
            {info.example && <p className="text-xs italic text-muted-foreground">{info.example}{info.example_sr ? ` — ${info.example_sr}` : ""}</p>}
            <Button size="sm" variant={saved ? "outline" : "hero"} className="w-full" disabled={saving || saved} onClick={save}>
              {saved ? <><Check className="w-4 h-4" /> Sačuvano</> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><BookmarkPlus className="w-4 h-4" /> Sačuvaj u Moj rečnik</>}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Renders a sentence where every word opens its meaning and a save button. */
export default function InteractiveText({ text, language, known, lessonCode }: { text: string; language: string; known: LessonWord[]; lessonCode?: string }) {
  const parts = text.split(/([\p{L}\p{M}'’-]+)/u);
  return (
    <>
      {parts.map((p, i) => /[\p{L}]/u.test(p)
        ? <WordPop key={i} word={p} sentence={text} language={language} lessonCode={lessonCode} known={known.find((k) => k.word.toLowerCase() === p.toLowerCase())} />
        : <span key={i}>{p}</span>)}
    </>
  );
}

export function KeyPhrases({ items, language, lessonCode }: { items: LessonWord[]; language: string; lessonCode?: string }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  if (!items.length) return null;
  const save = async (w: LessonWord) => {
    if (!user) return;
    try { await saveToMyDictionary(user.id, language, { ...w, topic: lessonCode }); setSaved((s) => new Set(s).add(w.word)); toast.success("Sačuvano u „Moj rečnik”"); }
    catch { toast.error("Čuvanje nije uspelo."); }
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
      <p className="font-semibold text-primary text-sm mb-2">Ključne reči i izrazi iz teksta</p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {items.map((w) => (
          <li key={w.word} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2">
            <span className="min-w-0"><span className="font-medium break-words">{w.word}</span> <span className="text-muted-foreground text-xs">— {w.translation}</span></span>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label="Sačuvaj" disabled={saved.has(w.word)} onClick={() => save(w)}>
              {saved.has(w.word) ? <Check className="w-4 h-4 text-forest" /> : <BookmarkPlus className="w-4 h-4" />}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
