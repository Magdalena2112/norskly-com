// Lightweight, non-reactive helpers to read the currently active learning
// language. Resolution order: URL route (/ucenje/:slug or /jezici/:slug)
// → localStorage → Norwegian fallback.
// In React components, prefer the `useSelectedLanguage()` hook.

import { getSelectedCourse } from "./courseSelection";

export type LanguageCode = "no" | "en" | "de";

export const LANG_STORAGE_KEY = "norskly_selected_language";
/** Set when the user actively picked a language in this browser session. */
export const LANG_INTENT_KEY = "norskly_language_intent";

const SLUG_TO_CODE: Record<string, LanguageCode> = {
  norveski: "no",
  engleski: "en",
  nemacki: "de",
};

export function slugToCode(slug?: string | null): LanguageCode {
  return (slug && SLUG_TO_CODE[slug]) || "no";
}

/** Reads `/ucenje/:slug` or `/jezici/:slug` from a pathname, if present. */
export function slugFromPath(pathname?: string): string | null {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const m = path.match(/^\/(?:ucenje|jezici)\/([^/]+)/);
  return m && SLUG_TO_CODE[m[1]] ? m[1] : null;
}

export function getCurrentLanguageSlug(pathname?: string): string {
  const fromPath = slugFromPath(pathname);
  if (fromPath) return fromPath;
  if (typeof window === "undefined") return "norveski";
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored && SLUG_TO_CODE[stored] ? stored : "norveski";
}

export function getCurrentLanguageCode(pathname?: string): LanguageCode {
  return slugToCode(getCurrentLanguageSlug(pathname));
}

/** localStorage key for the per-language cached profile. */
export function profileCacheKey(code: LanguageCode = getCurrentLanguageCode(), course = getSelectedCourse(code)): string {
  return `norskly_profile_${code}_${course}`;
}

/** Clears every language-scoped cache (used on sign out). */
export function clearLanguageCaches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LANG_STORAGE_KEY);
  localStorage.removeItem("norskly_profile");
  (["no", "en", "de"] as LanguageCode[]).forEach((c) =>
    ["general", "health"].forEach(course => localStorage.removeItem(profileCacheKey(c, course))),
  );
  try {
    sessionStorage.removeItem(LANG_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Reads cached profile of the active language and returns the AI personalization fields. */
export function getCurrentPersonalization(): { focus_area: string; life_context: string } {
  if (typeof window === "undefined") return { focus_area: "", life_context: "" };
  try {
    const raw = localStorage.getItem(profileCacheKey());
    if (!raw) return { focus_area: "", life_context: "" };
    const p = JSON.parse(raw);
    return {
      focus_area: (p?.focus_area || "").toString(),
      life_context: (p?.life_context || "").toString(),
    };
  } catch {
    return { focus_area: "", life_context: "" };
  }
}

const LOCATIVE: Record<LanguageCode, string> = { no: "norveškom", en: "engleskom", de: "nemačkom" };
const GENITIVE: Record<LanguageCode, string> = { no: "norveškog", en: "engleskog", de: "nemačkog" };
const NOMINATIVE: Record<LanguageCode, string> = { no: "norveški", en: "engleski", de: "nemački" };
const TTS: Record<LanguageCode, string> = { no: "nb-NO", en: "en-GB", de: "de-DE" };

/** "na engleskom" → returns "engleskom" for the active language. */
export const langLocative = (c: LanguageCode = getCurrentLanguageCode()) => LOCATIVE[c];
/** "profesor engleskog" → returns "engleskog". */
export const langGenitive = (c: LanguageCode = getCurrentLanguageCode()) => GENITIVE[c];
export const langNominative = (c: LanguageCode = getCurrentLanguageCode()) => NOMINATIVE[c];
export const ttsLang = (c: LanguageCode = getCurrentLanguageCode()) => TTS[c];

/** Speech synthesis in the active learning language. */
export function speakInCurrentLanguage(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/[#_~`>]/g, "").trim();
  const lang = ttsLang();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = lang;
  utter.rate = 0.9;
  const prefix = lang.slice(0, 2);
  const voice = window.speechSynthesis.getVoices().find((v) =>
    prefix === "nb" ? v.lang.startsWith("nb") || v.lang.startsWith("no") : v.lang.startsWith(prefix),
  );
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}
