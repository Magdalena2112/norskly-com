import { useEffect, useState } from "react";
import { LANGUAGES, type LanguageSlug } from "@/lib/languages";

const STORAGE_KEY = "norskly_selected_language";

/**
 * Metadata used for AI prompts and labels.
 * Keep this aligned with `LANGUAGES` in lib/languages.ts.
 */
export const LANGUAGE_META: Record<
  LanguageSlug,
  {
    slug: LanguageSlug;
    code: "no" | "en" | "de";
    /** Display name in Serbian (UI) */
    labelSr: string;
    /** Native name (used in AI prompts) */
    nativeName: string;
    /** Long description for AI system prompts */
    promptName: string;
  }
> = {
  norveski: { slug: "norveski", code: "no", labelSr: "Norveški", nativeName: "Norsk", promptName: "norveškog jezika (Bokmål)" },
  engleski: { slug: "engleski", code: "en", labelSr: "Engleski", nativeName: "English", promptName: "engleskog jezika" },
  nemacki:  { slug: "nemacki",  code: "de", labelSr: "Nemački",  nativeName: "Deutsch", promptName: "nemačkog jezika" },
};

export function getLanguageMetaByCode(code: string) {
  return Object.values(LANGUAGE_META).find((m) => m.code === code) || LANGUAGE_META.norveski;
}

function readStoredSlug(): LanguageSlug {
  const v = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "norveski";
  return (LANGUAGES.find((l) => l.slug === v)?.slug as LanguageSlug) || "norveski";
}

/**
 * Returns the currently selected learning language, reactive to storage changes
 * from other tabs and to in-app updates dispatched via `language-changed`.
 */
export function useSelectedLanguage() {
  const [slug, setSlug] = useState<LanguageSlug>(() => readStoredSlug());

  useEffect(() => {
    const onChange = () => setSlug(readStoredSlug());
    window.addEventListener("storage", onChange);
    window.addEventListener("language-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("language-changed", onChange);
    };
  }, []);

  const meta = LANGUAGE_META[slug];

  const setLanguage = (next: LanguageSlug) => {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event("language-changed"));
    setSlug(next);
  };

  return {
    slug,
    /** ISO code: `no` | `en` | `de` — send this to edge functions */
    code: meta.code,
    labelSr: meta.labelSr,
    nativeName: meta.nativeName,
    promptName: meta.promptName,
    setLanguage,
  };
}
