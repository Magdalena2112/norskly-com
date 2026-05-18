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

/** Reads cached profile from localStorage and returns the fields the AI prompts personalize against. */
export function getCurrentPersonalization(): { focus_area: string; life_context: string } {
  if (typeof window === "undefined") return { focus_area: "", life_context: "" };
  try {
    const raw = localStorage.getItem("norskly_profile");
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

