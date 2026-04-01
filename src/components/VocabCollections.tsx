import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Loader2, FolderOpen, Trash2, BookOpen, Brain, Layers,
  ChevronRight, Volume2, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VocabWordCard, { type GrammarForms } from "@/components/VocabWordCard";

// ─── Types ───
interface VocabWord {
  id: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  synonym: string | null;
  antonym: string | null;
  topic: string;
  word_type?: string | null;
  grammar_forms?: GrammarForms | null;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  wordCount?: number;
}

interface CollectionWord extends VocabWord {
  cw_id: string;
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

export default function VocabCollections({ userId }: { userId?: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "detail" | "add-words">("list");
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [collectionWords, setCollectionWords] = useState<CollectionWord[]>([]);

  // Create collection
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // All user words (for adding to collections)
  const [allWords, setAllWords] = useState<VocabWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [addingWords, setAddingWords] = useState(false);

  const fetchCollections = async () => {
    if (!userId) return;
    setLoading(true);
    const { data: cols } = await supabase
      .from("word_collections" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (cols) {
      // Get word counts
      const collectionsWithCounts: Collection[] = [];
      for (const c of cols as any[]) {
        const { count } = await supabase
          .from("collection_words" as any)
          .select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        collectionsWithCounts.push({ ...c, wordCount: count || 0 });
      }
      setCollections(collectionsWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCollections(); }, [userId]);

  const createCollection = async () => {
    if (!userId || !newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("word_collections" as any).insert({
      user_id: userId,
      name: newName.trim(),
      description: newDesc.trim() || null,
    } as any);
    if (!error) {
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      await fetchCollections();
    }
    setCreating(false);
  };

  const deleteCollection = async (id: string) => {
    await supabase.from("word_collections" as any).delete().eq("id", id);
    await fetchCollections();
    if (activeCollection?.id === id) {
      setView("list");
      setActiveCollection(null);
    }
  };

  const openCollection = async (col: Collection) => {
    setActiveCollection(col);
    setView("detail");
    // Fetch words in this collection
    const { data } = await supabase
      .from("collection_words" as any)
      .select("id, word_id, vocabulary_words(id, word, translation, example_sentence, synonym, antonym, topic, word_type, grammar_forms)")
      .eq("collection_id", col.id);

    const rows = (data as unknown as any[]) || [];
    const words: CollectionWord[] = rows
      .filter((r: any) => r.vocabulary_words)
      .map((r: any) => ({
        ...r.vocabulary_words,
        cw_id: r.id,
      }));
    setCollectionWords(words);
  };

  const removeWordFromCollection = async (cwId: string) => {
    await supabase.from("collection_words" as any).delete().eq("id", cwId);
    setCollectionWords((prev) => prev.filter((w) => w.cw_id !== cwId));
  };

  const openAddWords = async () => {
    if (!userId) return;
    setView("add-words");
    setLoadingWords(true);
    setSelectedWordIds(new Set());
    const { data } = await supabase
      .from("vocabulary_words" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setAllWords((data as unknown as VocabWord[]) || []);
    setLoadingWords(false);
  };

  const addWordsToCollection = async () => {
    if (!activeCollection || selectedWordIds.size === 0) return;
    setAddingWords(true);
    const rows = Array.from(selectedWordIds).map((wid) => ({
      collection_id: activeCollection.id,
      word_id: wid,
    }));
    await supabase.from("collection_words" as any).insert(rows as any);
    setAddingWords(false);
    await openCollection(activeCollection);
  };

  const toggleWordSelection = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ═══ LIST VIEW ═══
  if (view === "list") {
    return (
      <div className="space-y-4">
        <Card className="shadow-nordic bg-background/80 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Mine ordsamlinger</CardTitle>
            <CardDescription>Organizuj reči u kolekcije za kartice i kvizove.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="hero" className="w-full gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Kreiraj kolekciju
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent className="pt-8 pb-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" /></CardContent></Card>
        ) : collections.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center"><p className="text-muted-foreground">Nemate kolekcija. Kreirajte prvu!</p></CardContent></Card>
        ) : (
          collections.map((col) => (
            <Card key={col.id} className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => openCollection(col)}>
              <CardContent className="pt-5 pb-5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-foreground">{col.name}</p>
                  {col.description && <p className="text-sm text-muted-foreground">{col.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{col.wordCount} reči</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        )}

        {/* Create dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova kolekcija</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Naziv kolekcije" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} />
              <Textarea placeholder="Opis (opciono)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} maxLength={200} className="resize-none" />
              <Button variant="hero" className="w-full" onClick={createCollection} disabled={creating || !newName.trim()}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kreiraj"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══ ADD WORDS VIEW ═══
  if (view === "add-words" && activeCollection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => openCollection(activeCollection)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-display font-bold text-foreground">Dodaj reči u "{activeCollection.name}"</h3>
        </div>

        {loadingWords ? (
          <Card><CardContent className="pt-8 pb-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" /></CardContent></Card>
        ) : allWords.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center space-y-2">
            <p className="text-muted-foreground">Nemate sačuvanih reči.</p>
            <p className="text-sm text-muted-foreground">Generišite reči u "Generiši" tabu da biste ih dodali u kolekciju.</p>
          </CardContent></Card>
        ) : (
          <>
            {allWords.map((w) => (
              <Card key={w.id} className={`cursor-pointer transition-colors ${selectedWordIds.has(w.id) ? "border-accent bg-accent/5" : ""}`}
                onClick={() => toggleWordSelection(w.id)}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Checkbox checked={selectedWordIds.has(w.id)} onCheckedChange={() => toggleWordSelection(w.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{w.word} <span className="text-muted-foreground font-normal">— {w.translation}</span></p>
                    <p className="text-xs text-muted-foreground">{w.topic}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="hero" className="w-full" onClick={addWordsToCollection} disabled={addingWords || selectedWordIds.size === 0}>
              {addingWords ? <Loader2 className="w-4 h-4 animate-spin" /> : `Dodaj ${selectedWordIds.size} reči`}
            </Button>
          </>
        )}
      </div>
    );
  }

  // ═══ DETAIL VIEW ═══
  if (view === "detail" && activeCollection) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); setActiveCollection(null); }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h3 className="font-display font-bold text-foreground">{activeCollection.name}</h3>
            {activeCollection.description && <p className="text-xs text-muted-foreground">{activeCollection.description}</p>}
          </div>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCollection(activeCollection.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1 text-xs" onClick={openAddWords}>
            <Plus className="w-3 h-3" /> Dodaj reči
          </Button>
        </div>

        {collectionWords.length === 0 ? (
          <Card><CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">Kolekcija je prazna. Dodajte reči!</p>
          </CardContent></Card>
        ) : (
          <>
            {collectionWords.map((w) => (
              <VocabWordCard
                key={w.cw_id}
                data={{
                  word: w.word,
                  translation: w.translation,
                  word_type: w.word_type,
                  synonym: w.synonym,
                  antonym: w.antonym,
                  example_sentence: w.example_sentence,
                  grammar_forms: w.grammar_forms,
                }}
                showRemove
                onRemove={() => removeWordFromCollection(w.cw_id)}
              />
            ))}
          </>
        )}
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════
// Collection Picker for Flashcards/Quiz
// ═══════════════════════════════════════
export function CollectionPicker({
  userId,
  onStart,
  actionLabel,
  actionIcon,
  minWords = 1,
}: {
  userId?: string;
  onStart: (words: VocabWord[]) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  minWords?: number;
}) {
  const [collections, setCollections] = useState<(Collection & { words: VocabWord[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data: cols } = await supabase
        .from("word_collections" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const result: (Collection & { words: VocabWord[] })[] = [];
      for (const c of (cols as any[]) || []) {
        const { data: cw } = await supabase
          .from("collection_words" as any)
          .select("vocabulary_words(id, word, translation, example_sentence, synonym, antonym, topic, word_type, grammar_forms)")
          .eq("collection_id", c.id);
        const cwRows = (cw as unknown as any[]) || [];
        const words = cwRows.filter((r: any) => r.vocabulary_words).map((r: any) => r.vocabulary_words);
        result.push({ ...c, words, wordCount: words.length });
      }
      setCollections(result);
      setLoading(false);
    })();
  }, [userId]);

  const toggleCollection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allWords = collections
    .filter((c) => selected.has(c.id))
    .flatMap((c) => c.words);

  // Deduplicate by word id
  const uniqueWords = Array.from(new Map(allWords.map((w) => [w.id, w])).values());

  if (loading) {
    return <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" /></div>;
  }

  if (collections.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        Nemate kolekcija. Kreirajte kolekciju i dodajte reči u "Ordsamlinger" tabu.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Izaberite kolekcije:</p>
      {collections.map((col) => (
        <Card
          key={col.id}
          className={`cursor-pointer transition-colors ${selected.has(col.id) ? "border-accent bg-accent/5" : ""}`}
          onClick={() => toggleCollection(col.id)}
        >
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Checkbox checked={selected.has(col.id)} onCheckedChange={() => toggleCollection(col.id)} />
            <div>
              <p className="font-medium text-foreground">{col.name}</p>
              <p className="text-xs text-muted-foreground">{col.wordCount} reči</p>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="hero"
        className="w-full gap-2"
        disabled={uniqueWords.length < minWords}
        onClick={() => onStart(uniqueWords)}
      >
        {actionIcon} {actionLabel} ({uniqueWords.length} reči)
      </Button>
      {uniqueWords.length < minWords && selected.size > 0 && (
        <p className="text-xs text-destructive text-center">Potrebno je najmanje {minWords} reči.</p>
      )}
    </div>
  );
}
