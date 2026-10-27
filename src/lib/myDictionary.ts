import { supabase } from "@/integrations/supabase/client";

export const MY_DICTIONARY = "Moj rečnik";

export interface LessonWord { word: string; translation: string; /** Extra text spans (e.g. separated German verbs) to highlight as this word. */ forms?: string[] }

/** Collect every {word, translation} pair from a lesson's vocabulary module, whatever its shape. */
export function lessonWords(vocab: unknown): LessonWord[] {
  const out = new Map<string, LessonWord>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.word === "string" && typeof o.translation === "string") out.set(o.word.toLowerCase(), { word: o.word, translation: o.translation });
      Object.values(o).forEach(walk);
    }
  };
  walk(vocab);
  return [...out.values()];
}

const DE_ARTICLE = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines)\s+/i;
const DE_TRAILING_VERB = /\s+(haben|sein|werden|machen|schreiben|messen)$/i;

/** Text forms to look for: the base form, plus (German) the phrase without article / trailing helper verb. */
export function searchForms(word: string, language?: string): string[] {
  const w = word.toLowerCase().trim();
  const forms = new Set([w]);
  if (language === "de") {
    const noArt = w.replace(DE_ARTICLE, "");
    forms.add(noArt);
    forms.add(noArt.replace(DE_TRAILING_VERB, ""));
    forms.add(w.replace(DE_TRAILING_VERB, ""));
  }
  return [...forms].filter((f) => f.length > 2);
}

const isL = (c?: string) => !!c && /[\p{L}\p{M}'’-]/u.test(c);

/** Character ranges in `text` where lesson words appear in any form (German allows inflection endings). */
export function phraseRanges(text: string, words: LessonWord[], language?: string): { range: [number, number]; word: LessonWord }[] {
  const lower = text.toLowerCase();
  const out: { range: [number, number]; word: LessonWord }[] = [];
  const items = words.flatMap((w) => [...searchForms(w.word, language), ...(w.forms ?? []).map((f) => f.toLowerCase())].map((f) => ({ f, w }))).sort((a, b) => b.f.length - a.f.length);
  for (const { f, w } of items) {
    let from = 0, at: number;
    while ((at = lower.indexOf(f, from)) !== -1) {
      let end = at + f.length;
      if (language === "de") { let n = 0; while (n < 3 && isL(lower[end]) && lower[end] !== "-") { end++; n++; } }
      if (!isL(lower[at - 1]) && !isL(lower[end]) && !out.some(({ range: [s, e] }) => at < e && end > s)) out.push({ range: [at, end], word: w });
      from = at + f.length;
    }
  }
  return out;
}

/** Lesson words/phrases found in the text, listed in their base (dictionary) form. */
export function phrasesInText(text: string, words: LessonWord[], max = 8, language?: string): LessonWord[] {
  const found = new Map<string, LessonWord>();
  phraseRanges(text, words, language).forEach(({ word }) => found.set(word.word, word));
  return [...found.values()].sort((a, b) => b.word.length - a.word.length).slice(0, max);
}

export async function saveToMyDictionary(userId: string, language: string, entry: { word: string; translation: string; example?: string; pos?: string; topic?: string }) {
  const { data: existing } = await supabase.from("vocabulary_words").select("id").eq("user_id", userId).eq("language", language).ilike("word", entry.word).maybeSingle();
  let wordId = existing?.id as string | undefined;
  if (!wordId) {
    const { data, error } = await supabase.from("vocabulary_words").insert({
      user_id: userId, language, word: entry.word, translation: entry.translation,
      example_sentence: entry.example ?? null, word_type: entry.pos ?? null, topic: entry.topic || MY_DICTIONARY,
    }).select("id").single();
    if (error) throw error;
    wordId = data.id;
  }
  let { data: col } = await supabase.from("word_collections").select("id").eq("user_id", userId).eq("language", language).eq("name", MY_DICTIONARY).maybeSingle();
  if (!col) {
    const { data, error } = await supabase.from("word_collections").insert({ user_id: userId, language, name: MY_DICTIONARY, description: "Reči sačuvane iz lekcija" }).select("id").single();
    if (error) throw error;
    col = data;
  }
  const { data: link } = await supabase.from("collection_words").select("id").eq("collection_id", col.id).eq("word_id", wordId!).maybeSingle();
  if (!link) {
    const { error } = await supabase.from("collection_words").insert({ collection_id: col.id, word_id: wordId! });
    if (error) throw error;
  }
}

export interface DictEntry { linkId: string; wordId: string; word: string; translation: string; example: string | null; pos: string | null; topic: string; created_at: string }

export async function listMyDictionary(userId: string, language: string): Promise<DictEntry[]> {
  const { data: col } = await supabase.from("word_collections").select("id").eq("user_id", userId).eq("language", language).eq("name", MY_DICTIONARY).maybeSingle();
  if (!col) return [];
  const { data } = await supabase.from("collection_words").select("id, vocabulary_words(id, word, translation, example_sentence, word_type, topic, created_at)").eq("collection_id", col.id);
  return ((data || []) as any[]).filter((r) => r.vocabulary_words).map((r) => ({
    linkId: r.id, wordId: r.vocabulary_words.id, word: r.vocabulary_words.word, translation: r.vocabulary_words.translation,
    example: r.vocabulary_words.example_sentence, pos: r.vocabulary_words.word_type, topic: r.vocabulary_words.topic, created_at: r.vocabulary_words.created_at,
  })).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Removes the word from "Moj rečnik" only; the word itself stays in the learner's vocabulary. */
export async function removeFromMyDictionary(linkId: string) {
  const { error } = await supabase.from("collection_words").delete().eq("id", linkId);
  if (error) throw error;
}
