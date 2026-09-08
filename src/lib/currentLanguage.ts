// Lightweight, non-reactive helpers to read the currently active learning
// language. Resolution order: URL route (/ucenje/:slug or /jezici/:slug)
// → localStorage → Norwegian fallback.
// In React components, prefer the `useSelectedLanguage()` hook.

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
export function profileCacheKey(code: LanguageCode = getCurrentLanguageCode()): string {
  return `norskly_profile_${code}`;
}

/** Clears every language-scoped cache (used on sign out). */
export function clearLanguageCaches() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LANG_STORAGE_KEY);
  localStorage.removeItem("norskly_profile");
  (["no", "en", "de"] as LanguageCode[]).forEach((c) =>
    localStorage.removeItem(profileCacheKey(c)),
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
