import { supabase } from "@/integrations/supabase/client";

export const MY_DICTIONARY = "Moj rečnik";

export interface LessonWord { word: string; translation: string }

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

/** Lesson words/phrases that literally appear in the text (case-insensitive, whole words). */
export function phrasesInText(text: string, words: LessonWord[], max = 8): LessonWord[] {
  const t = ` ${text.toLowerCase().replace(/[.,!?;:"“”„()]/g, " ").replace(/\s+/g, " ")} `;
  return words.filter((w) => t.includes(` ${w.word.toLowerCase()} `)).sort((a, b) => b.word.length - a.word.length).slice(0, max);
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
