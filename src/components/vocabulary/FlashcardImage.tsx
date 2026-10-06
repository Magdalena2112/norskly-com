import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLanguageCode } from "@/lib/currentLanguage";

type Entry = { visual: boolean; url: string | null } | "loading" | "error";
const memo = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry>>();

function keyOf(word: string) {
  return `${getCurrentLanguageCode()}::${word.trim().toLowerCase()}`;
}

/** Fetches (and caches in memory) the shared illustration for a word. */
export function fetchWordImage(word: string, translation: string): Promise<Entry> {
  const key = keyOf(word);
  const hit = memo.get(key);
  if (hit && hit !== "loading") return Promise.resolve(hit);
  const existing = pending.get(key);
  if (existing) return existing;
  const p = supabase.functions
    .invoke("vocab-image", { body: { word, translation, language: getCurrentLanguageCode() } })
    .then(({ data, error }) => {
      const entry: Entry = error || !data ? "error" : { visual: !!data.visual, url: data.url ?? null };
      memo.set(key, entry);
      pending.delete(key);
      return entry;
    });
  pending.set(key, p);
  return p;
}

export function FlashcardImage({ word, translation }: { word: string; translation: string }) {
  const [entry, setEntry] = useState<Entry>(() => memo.get(keyOf(word)) ?? "loading");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    setEntry(memo.get(keyOf(word)) ?? "loading");
    fetchWordImage(word, translation).then((e) => alive && setEntry(e));
    return () => { alive = false; };
  }, [word, translation]);

  if (entry === "error" || (entry !== "loading" && (!entry.visual || !entry.url))) return null;

  return (
    <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden ring-4 ring-background shadow-lg rotate-[-2deg] bg-muted">
      {(entry === "loading" || !loaded) && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-background to-muted" />
      )}
      {entry !== "loading" && entry.url && (
        <img
          src={entry.url}
          alt={word}
          width={192}
          height={192}
          onLoad={() => setLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
