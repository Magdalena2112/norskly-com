/**
 * Route-specific SEO metadata used at build time to prerender static HTML
 * files for public routes. Keep values in sync with the <Helmet> blocks
 * rendered by the matching page components.
 */
export const SITE_URL = "https://norskly.com";

export interface RouteSeo {
  /** Route path, must start with "/" */
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const SEO_ROUTES: RouteSeo[] = [
  {
    path: "/",
    title: "Norskly — Pametniji način da naučiš norveški",
    description:
      "Norskly je platforma za učenje jezika kroz realne situacije, personalizovane lekcije i individualne časove sa profesorom.",
    ogTitle: "Norskly — Pametniji način da naučiš norveški",
    ogDescription:
      "Personalizovane vežbe, praktičan razgovor i podrška profesora — sve na jednom mestu.",
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
      "Otkrij strukturisan način učenja nemačkog — personalizovane vežbe, praktičan razgovor i podrška profesora na platformi Norskly.",
    ogTitle: "Uči nemački online uz personalizovanu podršku | Norskly",
    ogDescription:
      "Personalizovano učenje nemačkog, praktične vežbe i podrška profesora — sve na jednom mestu.",
  },
];
