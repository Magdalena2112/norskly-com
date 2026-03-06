import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Layers, Brain, CheckSquare, XSquare, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VocabWord {
  id: string;
  word: string;
  translation: string;
  example_sentence: string | null;
  synonym: string | null;
  antonym: string | null;
  topic: string;
}

interface CollectionWithWords {
  id: string;
  name: string;
  description: string | null;
  words: VocabWord[];
}

interface CollectionSelectorProps {
  userId?: string;
  tabKey: "kartice" | "kviz";
  onStart: (words: VocabWord[], shuffle: boolean) => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  minWords?: number;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CollectionSelector({
  userId,
  tabKey,
  onStart,
  actionLabel,
  actionIcon,
  minWords = 1,
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<CollectionWithWords[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shuffle, setShuffle] = useState(false);

  const storageKey = `vocab_selected_collections_${tabKey}`;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data: cols } = await supabase
        .from("word_collections" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const result: CollectionWithWords[] = [];
      for (const c of (cols as any[]) || []) {
        const { data: cw } = await supabase
          .from("collection_words" as any)
          .select("vocabulary_words(id, word, translation, example_sentence, synonym, antonym, topic)")
          .eq("collection_id", c.id);
        const cwRows = (cw as unknown as any[]) || [];
        const words = cwRows.filter((r: any) => r.vocabulary_words).map((r: any) => r.vocabulary_words);
        result.push({ id: c.id, name: c.name, description: c.description, words });
      }
      setCollections(result);

      // Restore last selection from localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const ids: string[] = JSON.parse(saved);
          const validIds = ids.filter((id) => result.some((c) => c.id === id));
          if (validIds.length > 0) setSelected(new Set(validIds));
        }
      } catch {}

      setLoading(false);
    })();
  }, [userId]);

  // Persist selection
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(selected)));
    }
  }, [selected, collections.length]);

  const toggleCollection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(collections.map((c) => c.id)));
  const deselectAll = () => setSelected(new Set());

  // Deduplicated words from selected collections
  const allWords = collections.filter((c) => selected.has(c.id)).flatMap((c) => c.words);
  const uniqueWords = Array.from(new Map(allWords.map((w) => [w.id, w])).values());

  const hasEmptySelected = selected.size > 0 && uniqueWords.length === 0;

  if (loading) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className="shadow-nordic">
        <CardContent className="pt-8 pb-8 text-center space-y-2">
          <p className="text-muted-foreground">Nemate kolekcija.</p>
          <p className="text-sm text-muted-foreground">
            Kreirajte kolekciju i dodajte reči u "Ordsamlinger" tabu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-nordic">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Izaberi kolekcije reči</CardTitle>
          <CardDescription>Označite kolekcije iz kojih želite da vežbate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Select all / Deselect all */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={selectAll}>
              <CheckSquare className="w-3.5 h-3.5" /> Izaberi sve
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={deselectAll}>
              <XSquare className="w-3.5 h-3.5" /> Poništi izbor
            </Button>
          </div>

          {/* Collections list */}
          {collections.map((col) => (
            <div
              key={col.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected.has(col.id)
                  ? "border-accent bg-accent/5"
                  : "border-border bg-background hover:border-accent/50"
              }`}
              onClick={() => toggleCollection(col.id)}
            >
              <Checkbox
                checked={selected.has(col.id)}
                onCheckedChange={() => toggleCollection(col.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{col.name}</p>
                <p className="text-xs text-muted-foreground">
                  {col.words.length} {col.words.length === 1 ? "reč" : "reči"}
                </p>
              </div>
            </div>
          ))}

          {/* Shuffle toggle */}
          <div className="flex items-center justify-between pt-1">
            <Label htmlFor={`shuffle-${tabKey}`} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Shuffle className="w-4 h-4" /> Izmešaj redosled
            </Label>
            <Switch id={`shuffle-${tabKey}`} checked={shuffle} onCheckedChange={setShuffle} />
          </div>

          {/* Empty collection warning */}
          {hasEmptySelected && (
            <p className="text-sm text-destructive text-center py-1">
              Ova kolekcija još nema sačuvane reči.
            </p>
          )}

          {/* Not enough words warning */}
          {!hasEmptySelected && selected.size > 0 && uniqueWords.length < minWords && (
            <p className="text-xs text-destructive text-center">
              Potrebno je najmanje {minWords} reči.
            </p>
          )}

          {/* Start button */}
          <Button
            variant="hero"
            className="w-full gap-2"
            disabled={selected.size === 0 || uniqueWords.length < minWords}
            onClick={() => onStart(shuffle ? shuffleArray(uniqueWords) : uniqueWords, shuffle)}
          >
            {actionIcon} {actionLabel} ({uniqueWords.length} reči)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
