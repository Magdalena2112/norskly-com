import type { LanguageSlug } from "@/lib/languages";

/** Jedna lekcija = 100 XP = jedan nivo; 12 lekcija po CEFR nivou. */
export const XP_PER_LEVEL = 100;
export const XP_MAX_LEVEL = 12;

const XP_TITLES: Record<LanguageSlug, string[]> = {
  norveski: [
    "Utforsker",
    "Lærling",
    "Kommunikatør",
    "Taler",
    "Trygg taler",
    "Avansert kommunikatør",
    "Flytende",
    "Dyktig",
    "Ekspert",
    "Mester",
    "Språkviter",
    "Norskly-mester",
  ],
  engleski: [
    "Explorer",
    "Learner",
    "Communicator",
    "Speaker",
    "Confident Speaker",
    "Advanced Communicator",
    "Fluent",
    "Skilled",
    "Expert",
    "Master",
    "Language Pro",
    "Norskly Master",
  ],
  nemacki: [
    "Entdecker",
    "Lehrling",
    "Kommunikator",
    "Sprecher",
    "Sicherer Sprecher",
    "Fortgeschrittener Kommunikator",
    "Fließend",
    "Geschickt",
    "Experte",
    "Meister",
    "Sprachprofi",
    "Norskly-Meister",
  ],
};

/** Titula za dati nivo na jeziku koji se uči (1–12, preko 12 ostaje poslednja). */
export function xpTitle(level: number, slug: LanguageSlug): string {
  const list = XP_TITLES[slug] ?? XP_TITLES.norveski;
  const idx = Math.min(Math.max(level, 1), XP_MAX_LEVEL) - 1;
  return list[idx];
}
