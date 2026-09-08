import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LANG_STORAGE_KEY, slugFromPath } from "@/lib/currentLanguage";

/**
 * Keeps the stored language in sync with the active route (/ucenje/:slug).
 * The route is always the source of truth while the student is inside a
 * language area, so no data from another language can leak in.
 */
export default function LanguageSync() {
  const location = useLocation();

  useEffect(() => {
    const slug = slugFromPath(location.pathname);
    if (!slug) return;
    if (localStorage.getItem(LANG_STORAGE_KEY) !== slug) {
      localStorage.setItem(LANG_STORAGE_KEY, slug);
    }
    window.dispatchEvent(new Event("language-changed"));
  }, [location.pathname]);

  return null;
}
