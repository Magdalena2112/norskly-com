export type LanguageSlug = "norveski" | "engleski" | "nemacki";

export interface LanguageUI {
  /** Small script line above hero greeting */
  heroScript: string;
  /** Hero body sentence (under "Hei, <name>.") */
  heroBody: string;
  /** Postcard stamp city (small visual hint) */
  stampCity: string;
  /** Section divider script (e.g. "Læringsmoduler") */
  modulesDivider: string;
  /** Module subtitles (script italic line above title) */
  module: {
    grammar: string;
    vocabulary: string;
    talk: string;
    writing: string;
    reading: string;
    teacher: string;
  };
}

export interface LanguageConfig {
  slug: LanguageSlug;
  code: "no" | "en" | "de";
  label: string;            // Serbian display
  flag: string;
  heroTitle: string;        // Serbian hero headline
  heroSubtitle: string;     // Serbian subtitle
  available: boolean;       // teachers/lessons available?
  ui: LanguageUI;           // dashboard/UI accents in target language
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
    ui: {
      heroScript: "Velkommen tilbake til fjordene",
      heroBody:
        "Tih dan među norveškim fjordovima. Udobno se smesti, izaberi modul i nastavi sa učenjem — korak po korak.",
      stampCity: "LOFOTEN",
      modulesDivider: "Læringsmoduler",
      module: {
        grammar: "Norsk grammatikk",
        vocabulary: "Ord & uttrykk",
        talk: "Snakk med AI",
        writing: "Skriving & bildebeskrivelse",
        reading: "Lesing & forståelse",
        teacher: "Lærer-time · 90 min",
      },
    },
  },
  {
    slug: "engleski",
    code: "en",
    label: "Engleski",
    flag: "🇬🇧",
    heroTitle: "Uči engleski uz AI i podršku profesora.",
    heroSubtitle:
      "Vežbaj engleski kroz realne razgovore, pametne lekcije i podršku iskusnih profesora.",
    available: true,
    ui: {
      heroScript: "Welcome back",
      heroBody:
        "Mirno popodne za engleski. Udobno se smesti, izaberi modul i nastavi učenje — korak po korak.",
      stampCity: "LONDON",
      modulesDivider: "Learning modules",
      module: {
        grammar: "English grammar",
        vocabulary: "Words & phrases",
        talk: "Talk with AI",
        writing: "Writing & picture description",
        reading: "Reading & comprehension",
        teacher: "Teacher session · 90 min",
      },
    },
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
    ui: {
      heroScript: "Willkommen zurück",
      heroBody:
        "Ein ruhiger Moment für Deutsch. Smesti se i izaberi modul — korak po korak.",
      stampCity: "BERLIN",
      modulesDivider: "Lernmodule",
      module: {
        grammar: "Deutsche Grammatik",
        vocabulary: "Wörter & Ausdrücke",
        talk: "Sprich mit der KI",
        writing: "Schreiben & Bildbeschreibung",
        reading: "Lesen & Verständnis",
        teacher: "Lehrerstunde · 90 min",
      },
    },
  },
];

export function getLanguageBySlug(slug?: string): LanguageConfig | undefined {
  return LANGUAGES.find((l) => l.slug === slug);
}

export function getLanguageByCode(code: string): LanguageConfig {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
