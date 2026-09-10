/**
 * Route-specific SEO metadata used at build time to prerender static HTML
 * files for public routes. Keep values in sync with the <Helmet> blocks
 * rendered by the matching page components.
 */
import { buildFaqPageSchema } from "../src/lib/faqData";

export const SITE_URL = "https://norskly.com";

export interface RouteSeo {
  /** Route path, must start with "/" */
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  /** Optional JSON-LD structured data object injected as application/ld+json. */
  structuredData?: object;
}

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "Norskly — Online učenje norveškog, engleskog i nemačkog jezika",
    description:
      "Uči norveški, engleski i nemački online kroz personalizovane vežbe, praktičan razgovor i podršku profesora. Norskly se prilagođava tvom nivou i ciljevima.",
    ogTitle: "Norskly — Pametniji način da naučiš jezike",
    ogDescription:
      "Uči norveški, engleski i nemački online kroz personalizovane vežbe, praktičan razgovor i podršku profesora — sve na jednom mestu.",
    structuredData: buildFaqPageSchema(SITE_URL),
  },
  {
    path: "/jezici/norveski",
    title: "Uči norveški online uz personalizovanu podršku | Norskly",
    description:
      "Uči norveški online kroz personalizovane vežbe, gramatiku, vokabular, čitanje, pisanje i podršku profesora na platformi Norskly.",
    ogTitle: "Uči norveški online uz personalizovanu podršku | Norskly",
    ogDescription:
      "Personalizovano učenje norveškog, praktične vežbe i podrška profesora — sve na jednom mestu.",
  },
  {
    path: "/jezici/engleski",
    title: "Uči engleski online uz personalizovanu podršku | Norskly",
    description:
      "Uči engleski online kroz personalizovane vežbe, gramatiku, vokabular, čitanje, pisanje i podršku profesora na platformi Norskly.",
    ogTitle: "Uči engleski online uz personalizovanu podršku | Norskly",
    ogDescription:
      "Personalizovano učenje engleskog, praktične vežbe i podrška profesora — sve na jednom mestu.",
  },
  {
    path: "/jezici/nemacki",
    title: "Uči nemački online uz personalizovanu podršku | Norskly",
    description:
      "Uči nemački online kroz personalizovane vežbe, gramatiku, vokabular, čitanje, pisanje i podršku profesora na platformi Norskly.",
    ogTitle: "Uči nemački online uz personalizovanu podršku | Norskly",
    ogDescription:
      "Personalizovano učenje nemačkog, praktične vežbe i podrška profesora — sve na jednom mestu.",
  },
  {
    path: "/za-profesore",
    title: "Postani predavač na Norskly platformi | Norskly",
    description:
      "Predaji jezike online preko Norskly platforme: prijava, verifikacija, individualni i grupni časovi, kursevi i alati za organizaciju nastave.",
    ogTitle: "Postani predavač na Norskly platformi | Norskly",
    ogDescription:
      "Prijavi se za predavanje na Norskly platformi i organizuj časove, kurseve i praćenje učenika na jednom mestu.",
  },
  {
    path: "/auth",
    title: "Prijava i registracija | Norskly",
    description:
      "Prijavi se na svoj Norskly nalog ili kreiraj novi i nastavi učenje jezika tamo gde si stao.",
    ogTitle: "Prijava i registracija | Norskly",
    ogDescription:
      "Prijavi se na Norskly ili napravi nalog i nastavi učenje svojim tempom.",
  },
  {
    path: "/unsubscribe",
    title: "Odjava od obaveštenja | Norskly",
    description:
      "Upravljaj svojim mejl obaveštenjima i odjavi se od Norskly obaveštenja.",
    ogTitle: "Odjava od obaveštenja | Norskly",
    ogDescription:
      "Upravljaj svojim mejl obaveštenjima i odjavi se od Norskly obaveštenja.",
  },
];
