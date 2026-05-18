// Shared personalization helpers for AI edge functions.
// Builds focus_area + life_context prompt lines tailored to the active language.

export type LangCode = "no" | "en" | "de";

const enFocusMap: Record<string, string> = {
  govor: "prioritize natural spoken phrasing, contractions, and conversational fillers",
  speaking: "prioritize natural spoken phrasing, contractions, and conversational fillers",
  pisanje: "favor a written register, full sentences, punctuation and paragraph flow",
  writing: "favor a written register, full sentences, punctuation and paragraph flow",
  gramatika: "weave one targeted grammar reminder into each correction",
  grammar: "weave one targeted grammar reminder into each correction",
  vokabular: "introduce 1–2 fresh on-topic words per reply and reuse them in context",
  vocabulary: "introduce 1–2 fresh on-topic words per reply and reuse them in context",
  izgovor: "flag tricky sounds, stress patterns and intonation when relevant",
  pronunciation: "flag tricky sounds, stress patterns and intonation when relevant",
};

const enLifeMap: Record<string, string> = {
  travel: "airports, hotels, directions, ordering food, sightseeing",
  "business english": "meetings, email phrasing, polite assertiveness, negotiation",
  business: "meetings, email phrasing, polite assertiveness, negotiation",
  "job interviews": "STAR answers, professional self-introduction, common interview questions",
  interviews: "STAR answers, professional self-introduction, common interview questions",
  "movies and series": "idioms, slang, pop-culture references",
  movies: "idioms, slang, pop-culture references",
  "everyday communication": "small talk, daily routines, casual conversations",
  everyday: "small talk, daily routines, casual conversations",
  "social media and internet": "casual tone, common abbreviations, online etiquette",
  "social media": "casual tone, common abbreviations, online etiquette",
  "studies abroad": "academic vocabulary, campus life, course registration",
  studies: "academic vocabulary, campus life, course registration",
};

const deFocusMap: Record<string, string> = {
  govor: "natürliche Sprechwendungen, Füllwörter und gesprochene Strukturen bevorzugen",
  speaking: "natürliche Sprechwendungen, Füllwörter und gesprochene Strukturen bevorzugen",
  pisanje: "schriftlichen Stil, vollständige Sätze, Satzzeichen und Absatzfluss bevorzugen",
  writing: "schriftlichen Stil, vollständige Sätze, Satzzeichen und Absatzfluss bevorzugen",
  gramatika: "einen gezielten Grammatik-Hinweis in jede Korrektur einflechten",
  grammar: "einen gezielten Grammatik-Hinweis in jede Korrektur einflechten",
  vokabular: "1–2 neue themenbezogene Wörter pro Antwort einführen",
  vocabulary: "1–2 neue themenbezogene Wörter pro Antwort einführen",
  izgovor: "schwierige Laute, Betonung und Intonation hervorheben",
  pronunciation: "schwierige Laute, Betonung und Intonation hervorheben",
};

export interface PersonalizationLines {
  /** Line to append to a Serbian-language system prompt. */
  serbianLine: string;
  /** Line to append to an English-language system prompt. */
  englishLine: string;
  /** Line to append to a German-language system prompt. */
  germanLine: string;
}

export function buildPersonalizationLines(
  language: LangCode,
  focus_area?: string | null,
  life_context?: string | null,
): PersonalizationLines {
  const focus = (focus_area || "").toString().toLowerCase().trim();
  const life = (life_context || "").toString().toLowerCase().trim();

  // ── Serbian (used as fallback for prompts written in Serbian, e.g. instruction prompts) ──
  const sFocus = focus ? `Fokusna oblast korisnika: "${focus}" — prilagodi primere, vežbe i ispravke toj oblasti.` : "";
  const sLife = life ? `Stvarni kontekst korisnika: "${life}" — biraj teme, primere i situacije iz tog konteksta.` : "";
  const serbianLine = [sFocus, sLife].filter(Boolean).join(" ");

  // ── English ──
  const eFocus = focus
    ? `Learner's focus area is "${focus}"${enFocusMap[focus] ? ` — ${enFocusMap[focus]}` : " — adapt examples and corrections accordingly"}.`
    : "";
  const eLife = life
    ? `Anchor examples, topics and vocabulary in the learner's real-life context: "${life}"${enLifeMap[life] ? ` (${enLifeMap[life]})` : ""}.`
    : "";
  const englishLine = [eFocus, eLife].filter(Boolean).join(" ");

  // ── German ──
  const gFocus = focus
    ? `Schwerpunkt des Lernenden: "${focus}"${deFocusMap[focus] ? ` — ${deFocusMap[focus]}` : " — Beispiele und Korrekturen entsprechend anpassen"}.`
    : "";
  const gLife = life
    ? `Beispiele, Themen und Wortschatz im realen Kontext des Lernenden verankern: "${life}".`
    : "";
  const germanLine = [gFocus, gLife].filter(Boolean).join(" ");

  if (language === "en") return { serbianLine, englishLine, germanLine };
  if (language === "de") return { serbianLine, englishLine, germanLine };
  return { serbianLine, englishLine, germanLine };
}
