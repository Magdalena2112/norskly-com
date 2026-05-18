// Lightweight, non-reactive helper to read the currently active learning
// language code from localStorage. Use this anywhere you need the language
// outside of React render (DB inserts, RPC calls, helpers, etc.).
// In React components, prefer the `useSelectedLanguage()` hook.

export type LanguageCode = "no" | "en" | "de";

const SLUG_TO_CODE: Record<string, LanguageCode> = {
  norveski: "no",
  engleski: "en",
  nemacki: "de",
};

export function getCurrentLanguageCode(): LanguageCode {
  if (typeof window === "undefined") return "no";
  const slug = localStorage.getItem("norskly_selected_language") || "norveski";
  return SLUG_TO_CODE[slug] || "no";
}
