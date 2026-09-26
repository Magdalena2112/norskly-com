export type CountryId = "norveska" | "nemacka";

export const PLACEHOLDER = "Sadržaj uskoro — proveravamo zvanične izvore.";

export const STEPS = [
  { id: "uslovi", num: "01", short: "Uslovi", title: "Proveri uslove", cta: "Proveri uslove" },
  { id: "posao", num: "02", short: "Posao", title: "Pronalaženje posla", cta: "Kako pronaći posao" },
  { id: "diploma", num: "03", short: "Diploma", title: "Diploma i kvalifikacije", cta: "Proveri priznavanje diplome" },
  { id: "dokumenta", num: "04", short: "Dokumenta", title: "Priprema dokumentacije", cta: "Pogledaj kompletnu listu" },
  { id: "dozvola", num: "05", short: "Dozvola", title: "Viza i boravišna dozvola", cta: "Pogledaj proces prijave" },
  { id: "pre-odlaska", num: "06", short: "Pre odlaska", title: "Pre odlaska iz Srbije", cta: "" },
  { id: "nakon-dolaska", num: "07", short: "Nakon dolaska", title: "Prvi koraci nakon dolaska", cta: "Prvi koraci nakon dolaska" },
  { id: "linkovi", num: "08", short: "Linkovi", title: "Korisni linkovi", cta: "" },
] as const;

export const TOPICS: Record<"uslovi" | "posao" | "diploma", string[]> = {
  uslovi: [
    "Ko može da se preseli radi rada",
    "Da li je potrebna viza ili boravišna dozvola",
    "Osnovni uslovi za rad",
    "Da li je potreban određeni nivo jezika",
  ],
  posao: [
    "Gde tražiti posao",
    "Osnovne smernice za CV i prijavu",
    "Intervju za posao",
    "Šta proveriti pre prihvatanja ponude",
    "Osnovne informacije o ugovoru o radu",
  ],
  diploma: [
    "Da li profesija zahteva priznavanje diplome",
    "Gde se diploma priznaje",
    "Potrebna dokumentacija",
    "Prevodi i apostil",
    "Okvirno trajanje procesa",
    "Šta ako kvalifikacija nije potpuno priznata",
  ],
};

export const DOCUMENTS = [
  "Pasoš",
  "Ugovor ili ponuda za posao",
  "Diploma",
  "Dodatak diplomi",
  "Potvrde o radnom iskustvu",
  "Dokaz o znanju jezika",
  "Prevodi",
  "Apostil, kada je potreban",
  "Dokaz o smeštaju",
  "Dodatna dokumentacija potrebna za prijavu",
];

export const DOC_QUESTIONS = ["Šta je ovo?", "Gde se dobija?", "Da li se prevodi?"];

export const PERMIT_STEPS = [
  "Prikupi dokumentaciju",
  "Popuni prijavu",
  "Zakaži termin",
  "Predaj dokumenta",
  "Sačekaj odluku",
  "Dobij dozvolu",
];

export const PERMIT_FIELDS = [
  "Šta treba da uradiš",
  "Gde se postupak obavlja",
  "Potrebna dokumentacija",
  "Takse",
  "Okvirno trajanje",
  "Zvanični izvor",
];

export const BEFORE_LEAVING = [
  "Smeštaj",
  "Zdravstveno osiguranje",
  "Kopije važnih dokumenata",
  "Finansijska sredstva za prve mesece",
  "Putovanje",
  "Bankovne kartice",
  "Telefon i internet",
  "Vozačka dozvola",
  "Dokumentacija za partnera ili decu, kada je relevantno",
];

export interface LinkItem { name: string; desc: string; url: string }
export interface LinkGroup { category: string; items: LinkItem[] }

export interface CountryData {
  id: CountryId;
  name: string;
  flag: string;
  tagline: string;
  arrival: string[];
  links: LinkGroup[];
}

export const COUNTRIES: Record<CountryId, CountryData> = {
  norveska: {
    id: "norveska",
    name: "Norveška",
    flag: "🇳🇴",
    tagline: "Posao · dokumenta · studije · život",
    arrival: [
      "Prijava dolaska / identifikacija",
      "D-number ili fødselsnummer",
      "Poreska kartica",
      "Banka",
      "BankID",
      "Zdravstveni sistem",
      "Početak rada",
    ],
    links: [
      { category: "Imigracija", items: [{ name: "UDI", desc: "Norveška uprava za imigraciju.", url: "https://www.udi.no" }] },
      { category: "Posao", items: [{ name: "NAV", desc: "Služba za rad i socijalna pitanja.", url: "https://www.nav.no" }] },
      { category: "Porezi", items: [{ name: "Skatteetaten", desc: "Norveška poreska uprava.", url: "https://www.skatteetaten.no" }] },
      { category: "Priznavanje kvalifikacija", items: [{ name: "HK-dir", desc: "Direktorat za visoko obrazovanje i kompetencije.", url: "https://hkdir.no" }] },
      { category: "Zdravstvo", items: [{ name: "Helsenorge", desc: "Zvanični portal norveškog zdravstva.", url: "https://www.helsenorge.no" }] },
      { category: "Javna uprava", items: [{ name: "Altinn", desc: "Portal za elektronske usluge javne uprave.", url: "https://www.altinn.no" }] },
    ],
  },
  nemacka: {
    id: "nemacka",
    name: "Nemačka",
    flag: "🇩🇪",
    tagline: "Posao · Ausbildung · dokumenta · život",
    arrival: [
      "Prijava adrese / Anmeldung",
      "Boravišna dozvola",
      "Poreski broj",
      "Zdravstveno osiguranje",
      "Banka",
      "Socijalno osiguranje",
      "Početak rada",
    ],
    links: [
      { category: "Imigracija", items: [
        { name: "Make it in Germany", desc: "Zvanični portal za kvalifikovane radnike.", url: "https://www.make-it-in-germany.com" },
        { name: "Auswärtiges Amt", desc: "Savezno ministarstvo spoljnih poslova — vize.", url: "https://www.auswaertiges-amt.de" },
      ] },
      { category: "Posao", items: [{ name: "Bundesagentur für Arbeit", desc: "Savezna agencija za zapošljavanje.", url: "https://www.arbeitsagentur.de" }] },
      { category: "Priznavanje kvalifikacija", items: [{ name: "Anerkennung in Deutschland", desc: "Zvanični portal za priznavanje kvalifikacija.", url: "https://www.anerkennung-in-deutschland.de" }] },
      { category: "Boravak", items: [{ name: "BAMF", desc: "Savezni zavod za migracije i izbeglice.", url: "https://www.bamf.de" }] },
      { category: "Porezi", items: [{ name: "BZSt", desc: "Savezni centralni poreski ured.", url: "https://www.bzst.de" }] },
      { category: "Zdravstvo", items: [{ name: "Bundesgesundheitsministerium", desc: "Savezno ministarstvo zdravlja.", url: "https://www.bundesgesundheitsministerium.de" }] },
    ],
  },
};
