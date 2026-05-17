export type LanguageSlug = "norveski" | "engleski" | "nemacki";

export interface LanguageConfig {
  slug: LanguageSlug;
  code: "no" | "en" | "de";
  label: string;            // Serbian display
  flag: string;
  heroTitle: string;        // Serbian hero headline
  heroSubtitle: string;     // Serbian subtitle
  available: boolean;       // teachers/lessons available?
}

export const LANGUAGES: LanguageConfig[] = [
  {
    slug: "norveski",
    code: "no",
    label: "Norveški",
    flag: "🇳🇴",
    heroTitle: "Uči norveški uz AI i podršku profesora.",
    heroSubtitle:
      "Personalizovane lekcije, razgovori sa AI-em i živi časovi sa profesorom — sve na jednom mestu.",
    available: true,
  },
  {
    slug: "engleski",
    code: "en",
    label: "Engleski",
    flag: "🇬🇧",
    heroTitle: "Uči engleski uz AI i podršku profesora.",
    heroSubtitle:
      "Vežbaj engleski kroz realne razgovore, pametne lekcije i podršku iskusnih profesora.",
    available: false,
  },
  {
    slug: "nemacki",
    code: "de",
    label: "Nemački",
    flag: "🇩🇪",
    heroTitle: "Uči nemački uz AI i podršku profesora.",
    heroSubtitle:
      "Otkrij strukturisan i prirodan način učenja nemačkog — uz AI i žive časove.",
    available: false,
  },
];

export function getLanguageBySlug(slug?: string): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.slug === slug);
}
