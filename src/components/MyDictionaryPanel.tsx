import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Loader2, Plus, Search, Trash2, Volume2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listMyDictionary, removeFromMyDictionary, saveToMyDictionary, MY_DICTIONARY, type DictEntry } from "@/lib/myDictionary";
import { speakLines } from "@/lib/courseLessons";
import { toast } from "sonner";

type Filter = "all" | "lesson" | "own";

export default function MyDictionaryPanel({ language, compact = false }: { language: string; compact?: boolean }) {
  const { user } = useAuth();
  const [items, setItems] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ word: "", translation: "", example: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setItems(await listMyDictionary(user.id, language));
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user?.id, language]);

  const add = async () => {
    if (!user || !form.word.trim() || !form.translation.trim()) return;
    setSaving(true);
    try {
      await saveToMyDictionary(user.id, language, { word: form.word.trim(), translation: form.translation.trim(), example: form.example.trim() || undefined });
      setForm({ word: "", translation: "", example: "" }); setAdding(false);
      toast.success("Reč je dodata u „Moj rečnik”"); await load();
    } catch { toast.error("Reč nije sačuvana. Pokušaj ponovo."); }
    setSaving(false);
  };

  const remove = async (e: DictEntry) => {
    try { await removeFromMyDictionary(e.linkId); setItems((s) => s.filter((x) => x.linkId !== e.linkId)); }
    catch { toast.error("Brisanje nije uspelo."); }
  };

  const term = q.trim().toLowerCase();
  const shown = items.filter((e) =>
    (filter === "all" || (filter === "own" ? e.topic === MY_DICTIONARY : e.topic !== MY_DICTIONARY)) &&
    (!term || e.word.toLowerCase().includes(term) || e.translation.toLowerCase().includes(term)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraži reč ili prevod" className="pl-9" />
        </div>
        <Button onClick={() => setAdding((a) => !a)} className="gap-1"><Plus className="w-4 h-4" /> Dodaj reč</Button>
      </div>

      {adding && (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 space-y-2">
          <Input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} placeholder="Reč ili izraz" />
          <Input value={form.translation} onChange={(e) => setForm({ ...form, translation: e.target.value })} placeholder="Prevod na srpski" />
          <Input value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} placeholder="Primer rečenice (nije obavezno)" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>Otkaži</Button>
            <Button onClick={add} disabled={saving || !form.word.trim() || !form.translation.trim()}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sačuvaj"}</Button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto">
        {([["all", "Sve reči"], ["lesson", "Iz lekcija"], ["own", "Lično dodate"]] as [Filter, string][]).map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)} className="shrink-0">{l}</Button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground shrink-0">{items.length} reči</span>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          {items.length ? "Nema reči za ovu pretragu." : "Još nema sačuvanih reči. Klikni na reč u uvodnom tekstu ili dodaj svoju."}
        </div>
      ) : (
        <ul className={compact ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
          {shown.map((e) => (
            <li key={e.linkId} className="rounded-xl border border-border/50 bg-card/80 p-3 flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary break-words">{e.word}{e.pos && <span className="ml-2 text-[11px] font-normal text-muted-foreground">{e.pos}</span>}</p>
                <p className="text-sm text-foreground/80 break-words">{e.translation}</p>
                {e.example && <p className="text-xs italic text-muted-foreground mt-1 break-words">{e.example}</p>}
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Slušaj" onClick={() => speakLines([{ speaker: "A", text: e.word }], language, {})}><Volume2 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground" aria-label="Ukloni" onClick={() => remove(e)}><Trash2 className="w-4 h-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
