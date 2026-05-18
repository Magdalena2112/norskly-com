import { supabase } from "@/integrations/supabase/client";
import { LANGUAGE_META } from "@/hooks/useSelectedLanguage";
import type { LanguageCode } from "@/lib/currentLanguage";

const SLUG_TO_CODE: Record<string, LanguageCode> = {
  norveski: "no",
  engleski: "en",
  nemacki: "de",
};

/** Resolve the active language code from URL (/ucenje/:slug) or localStorage. */
export function getActiveLanguageCode(pathname?: string): LanguageCode {
  if (pathname) {
    const m = pathname.match(/^\/ucenje\/([^/]+)/);
    if (m && SLUG_TO_CODE[m[1]]) return SLUG_TO_CODE[m[1]];
  }
  if (typeof window === "undefined") return "no";
  const slug = localStorage.getItem("norskly_selected_language") || "norveski";
  return SLUG_TO_CODE[slug] || "no";
}

export function codeToSlug(code: LanguageCode): string {
  return LANGUAGE_META[
    (Object.keys(LANGUAGE_META) as Array<keyof typeof LANGUAGE_META>).find(
      (k) => LANGUAGE_META[k].code === code,
    ) || "norveski"
  ].slug;
}

/** Returns true if the user has completed onboarding for the given language. */
export async function isLanguageOnboarded(userId: string, language: LanguageCode): Promise<boolean> {
  const { data } = await supabase
    .from("language_profiles")
    .select("onboarding_completed")
    .eq("user_id", userId)
    .eq("language", language)
    .maybeSingle();
  return !!data?.onboarding_completed;
}
