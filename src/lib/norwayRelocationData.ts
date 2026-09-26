/** Practical guide for Serbian citizens considering skilled work in Norway. Official guidance takes precedence. */
export interface NorwaySource { label: string; url: string }
export interface NorwayTopic {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: NorwaySource;
}

export const NORWAY_SOURCES = {
  udi: { label: "UDI – radne dozvole za državljane Srbije", url: "https://www.udi.no/en/want-to-apply/work-immigration/?c=srb" },
  skilled: { label: "UDI – Skilled Worker", url: "https://www.udi.no/en/want-to-apply/work-immigration/skilled-workers/?c=srb" },
  offer: { label: "UDI – potvrda ponude za posao", url: "https://www.udi.no/en/important-messages/confirmation-of-a-job-offer" },
  fee: { label: "UDI – aktuelne takse", url: "https://www.udi.no/en/word-definitions/fees" },
  checklist: { label: "UDI – personalizovana prijava i checklista", url: "https://www.udi.no/en/want-to-apply/?c=srb" },
  visit: { label: "Norway in Serbia – ulazak i boravišna dozvola", url: "https://www.norway.no/en/serbia/services-info/central-visa-handling/" },
  jobs: { label: "Arbeidsplassen – poslovi", url: "https://arbeidsplassen.nav.no/stillinger" },
  nav: { label: "NAV – rad i socijalno osiguranje", url: "https://www.nav.no/en/home" },
  finn: { label: "FINN Jobb – oglasi", url: "https://www.finn.no/job/browse.html" },
  regulated: { label: "HK-dir – regulisane profesije", url: "https://hkdir.no/en/foreign-education/lists-and-databases/regulated-professions" },
  recognition: { label: "HK-dir – priznavanje obrazovanja", url: "https://hkdir.no/en/foreign-education/do-i-need-recognition/i-want-to-work-in-norway" },
  sua: { label: "SUA – servis za strane radnike", url: "https://www.sua.no/en/" },
  police: { label: "Politiet – policija", url: "https://www.politiet.no/en/" },
  tax: { label: "Skatteetaten – poreska kartica i identifikacioni broj", url: "https://www.skatteetaten.no/en/person/foreign/are-you-intending-to-work-in-norway/" },
  paye: { label: "Skatteetaten – PAYE sistem", url: "https://www.skatteetaten.no/en/person/taxes/tax-deduction-card-and-advance-tax/i-am-a-foreign-employee/paye/" },
  health: { label: "Helsenorge – zdravstvene usluge", url: "https://www.helsenorge.no/en/foreigners-in-norway/" },
  bankid: { label: "BankID – digitalni identitet", url: "https://bankid.no/en" },
} satisfies Record<string, NorwaySource>;

export const NORWAY_GUIDE: Record<string, { intro?: string; topics: NorwayTopic[] }> = {
  uslovi: {
    intro: "Ovaj vodič prati najčešći put za državljane Srbije koji traže posao u Norveškoj kao kvalifikovani radnici. Pravila zavise od tvoje situacije i vrste dozvole.",
    topics: [
      { title: "Kratka poseta nije dozvola za rad", paragraphs: ["Sa biometrijskim pasošem Srbije možeš posetiti Norvešku bez vize do 90 dana u periodu od 180 dana. To samo po sebi ne daje pravo na rad. Za preseljenje i rad potrebna je odgovarajuća boravišna dozvola."], source: NORWAY_SOURCES.visit },
      { title: "Najčešći put: Skilled Worker", paragraphs: ["Za rad kod norveškog poslodavca obično prvo treba da dobiješ konkretnu ponudu. Posao mora zahtevati stručne kvalifikacije koje imaš. UDI razmatra visoko ili odgovarajuće stručno obrazovanje, a u posebnim slučajevima i posebno dokazano dugogodišnje iskustvo."], bullets: ["Proveri da li tvoje kvalifikacije odgovaraju radnom mestu.", "Proveri radno vreme, platu i uslove rada prema pravilima UDI-ja.", "Ako je profesija regulisana, proveri potrebnu autorizaciju.", "Ako još nemaš posao, pređi na korak 02."], source: NORWAY_SOURCES.skilled },
    ],
  },
  posao: {
    intro: "Za većinu kandidata iz Srbije posao dolazi pre prijave za boravišnu dozvolu.",
    topics: [
      { title: "Gde tražiti posao", paragraphs: ["Arbeidsplassen je zvanični portal za oglase povezan sa NAV-om; možeš filtrirati zanimanje, mesto i radni jezik. NAV pruža informacije o tržištu rada, a FINN Jobb je dodatni komercijalni portal."], source: NORWAY_SOURCES.jobs },
      { title: "CV, motivaciono pismo i jezik", paragraphs: ["Pripremi CV sa obrazovanjem, iskustvom, veštinama, jezicima i sertifikatima, kao i kratko motivaciono pismo (søknad / cover letter). Proveri jezik naveden u oglasu: za neke poslove je dovoljan engleski, dok drugi traže norveški; za regulisane profesije mogu važiti posebni uslovi."], source: NORWAY_SOURCES.nav },
      { title: "Pre prihvatanja ponude", bullets: ["Proveri naziv pozicije, mesto rada i datum početka.", "Proveri procenat radnog vremena i bruto platu.", "Proveri da li posao zahteva tvoju kvalifikaciju i profesionalnu autorizaciju.", "Pitaj poslodavca da li mora da potvrdi ponudu UDI-ju pre tvoje prijave iz inostranstva."], paragraphs: ["Od februara 2026. za Skilled Worker prijave koje kandidat sam podnosi iz inostranstva poslodavac potvrđuje ponudu UDI-ju i šalje kod od četiri engleske reči. Ako poslodavac podnosi prijavu, postupak može biti drugačiji."], source: NORWAY_SOURCES.offer },
    ],
  },
  diploma: {
    intro: "Nije potrebno formalno priznati svaku stranu diplomu: najpre proveri da li je tvoje zanimanje regulisano.",
    topics: [
      { title: "Profesija nije regulisana", paragraphs: ["Za mnoge poslove poslodavac sam procenjuje tvoje obrazovanje i iskustvo. Možeš zatražiti opšte priznavanje stranog obrazovanja kod HK-dir-a kako bi poslodavac lakše razumeo nivo i obim diplome; ono nije automatski uslov za svaki posao."], source: NORWAY_SOURCES.recognition },
      { title: "Profesija je regulisana", paragraphs: ["Za određene zdravstvene, obrazovne i druge regulisane profesije potrebno je priznanje ili autorizacija nadležnog organa. Uslovi zavise od profesije i porekla kvalifikacije."], bullets: ["Pronađi svoju profesiju na listi HK-dir-a.", "Proveri koji je nadležni organ i koje dokumente traži.", "Podnesi zahtev za autorizaciju ako je potrebna."], source: NORWAY_SOURCES.regulated },
    ],
  },
  dokumenta: {
    intro: "Ovo je osnovni pregled za put kvalifikovanog radnika, ne konačna lista. Uvek proveri personalizovanu UDI checklistu za svoje državljanstvo i kategoriju dozvole pre predaje.",
    topics: [
      { title: "Identitet", bullets: ["Važeći pasoš.", "Fotografije i dodatna lična dokumenta ako ih traži tvoja UDI checklista."] },
      { title: "Kvalifikacije", bullets: ["Diploma fakulteta ili odgovarajuće stručne škole i dokazi o trajanju i sadržaju obrazovanja, ako se traže.", "Potvrde o iskustvu, profesionalni sertifikati i autorizacija za regulisanu profesiju, ako su primenljivi.", "Ako se oslanjaš na iskustvo umesto obrazovanja, pripremi detaljne potvrde prethodnih poslodavaca."] },
      { title: "Ponuda za posao", bullets: ["Ponuda ili ugovor sa nazivom radnog mesta, radnim vremenom, platom i podacima o poslodavcu.", "Potvrda ponude od poslodavca kada je UDI zahteva."] },
    ],
  },
  dozvola: {
    intro: "Kada imaš posao i potrebnu dokumentaciju, prati uputstva koja UDI prikaže za tvoje državljanstvo i kategoriju prijave.",
    topics: [
      { title: "01 · Potvrda poslodavca", paragraphs: ["Ako sam/a podnosiš Skilled Worker prijavu iz inostranstva, poslodavac prvo potvrđuje ponudu UDI-ju i šalje ti kod od četiri engleske reči za prijavu. Proveri tačan postupak pre podnošenja."], source: NORWAY_SOURCES.offer },
      { title: "02 · Online prijava i taksa", paragraphs: ["Na UDI sajtu izaberi radnu imigraciju, državljanstvo Srbije i odgovarajuću kategoriju. Popuni prijavu, plati taksu i preuzmi listu dokumenata. Iznos takse se menja; proveri aktuelni iznos na zvaničnoj stranici pre plaćanja."], source: NORWAY_SOURCES.fee },
      { title: "03 · Predaja dokumentacije", paragraphs: ["Zakaži predaju prema instrukcijama UDI-ja. Za Srbiju informacije o predaji pruža VFS u Beogradu, a ambasada Norveške u Ankari obrađuje zahteve iz Srbije. Uvek proveri aktuelnu lokaciju i termine pre odlaska."], source: NORWAY_SOURCES.visit },
      { title: "04 · Odluka i preseljenje", paragraphs: ["Sačekaj odluku i potvrdu prava na rad; bezvizni ulazak nije dozvola za rad. Zatim organizuj preseljenje i korake nakon dolaska."], source: NORWAY_SOURCES.udi },
    ],
  },
  "pre-odlaska": {
    intro: "Po dobijanju odobrenja pripremi prve nedelje boravka, dokumenta i osnovne troškove.",
    topics: [
      { title: "Dokumenta za put", bullets: ["Ponesi pasoš, UDI odluku, ugovor o radu, diplome i sertifikate.", "Ponesi profesionalnu autorizaciju ako je imaš, druga važna lična dokumenta i kopije."] },
      { title: "Smeštaj i finansije", paragraphs: ["Obezbedi makar privremenu adresu za prve nedelje; može biti važna za registraciju, poštu i banku."], bullets: ["Planiraj depozit i prvu kiriju.", "Planiraj hranu, prevoz, telefon i troškove do prve plate."] },
      { title: "Termini pre polaska", paragraphs: ["Kada je moguće, proveri termine za policiju ili SUA, proveru identiteta i poresku karticu. SUA na jednom mestu okuplja službe za strane radnike u pojedinim gradovima."], source: NORWAY_SOURCES.sua },
    ],
  },
  "nakon-dolaska": {
    intro: "Redosled i konkretni postupci zavise od vrste dozvole i tvojih dokumenata; prati instrukcije u odluci UDI-ja.",
    topics: [
      { title: "01 · Policija i boravišna kartica", paragraphs: ["Prati instrukcije za termin kod policije i izdavanje residence card (boravišne kartice). Pravo na rad i početak rada proveri u svojoj odluci i instrukcijama UDI-ja, ne samo na osnovu ulaska bez vize."], source: NORWAY_SOURCES.udi },
      { title: "02 · D-number ili fødselsnummer", paragraphs: ["Norveška koristi privremeni D-number i nacionalni identifikacioni broj (fødselsnummer). Nadležni organ utvrđuje koji ti pripada na osnovu statusa i trajanja boravka; D-number se ne traži kao samostalna obična prijava."], source: NORWAY_SOURCES.tax },
      { title: "03 · Prijava preseljenja", paragraphs: ["Ako planiraš boravak od šest meseci ili duže, proveri obavezu prijave preseljenja u Folkeregisteret (nacionalni registar)."], source: NORWAY_SOURCES.tax },
      { title: "04 · Poreska kartica (skattekort)", paragraphs: ["Za rad ti je potrebna poreska kartica. Može biti potrebna i provera identiteta. Bez kartice poslodavac može morati da zadrži 50% plate za porez. Novi strani radnici često ulaze u dobrovoljni PAYE sistem; stopa i uslovi zavise od godine i prihoda, zato ih proveri na Skatteetaten-u."], source: NORWAY_SOURCES.paye },
      { title: "05 · Bankovni račun", paragraphs: ["Banka proverava identitet i određuje potrebnu dokumentaciju. Pripremi pasoš, identifikacioni broj, adresu i, ako traži, dokaz o zaposlenju."], source: NORWAY_SOURCES.tax },
      { title: "06 · BankID", paragraphs: ["BankID je digitalni identitet za mnoge usluge. Dobija se preko banke, koja proverava tvoj identitet i uslove za izdavanje."], source: NORWAY_SOURCES.bankid },
      { title: "07 · Zdravstveno i socijalno osiguranje", paragraphs: ["Proveri svoje pravo na zdravstvene usluge i članstvo u sistemu socijalnog osiguranja prema radnom i boravišnom statusu. Pravila i participacije zavise od situacije."], source: NORWAY_SOURCES.health },
    ],
  },
};

export const NORWAY_BEFORE_LEAVING = [
  "Pasoš, UDI odluka i ugovor o radu", "Diplome, sertifikati i potrebna autorizacija", "Kopije važnih dokumenata",
  "Privremeni smeštaj i adresa", "Depozit i prva kirija", "Novac za hranu, prevoz i telefon do prve plate",
  "Provera termina kod policije / SUA", "Provera termina za ID check i poresku karticu",
];

export const NORWAY_LINK_GROUPS = [
  { category: "Imigracija i rad", items: [NORWAY_SOURCES.udi, NORWAY_SOURCES.skilled, NORWAY_SOURCES.visit] },
  { category: "Posao", items: [NORWAY_SOURCES.jobs, NORWAY_SOURCES.nav, NORWAY_SOURCES.finn] },
  { category: "Diplome i profesije", items: [NORWAY_SOURCES.regulated, NORWAY_SOURCES.recognition] },
  { category: "Prijava i dolazak", items: [NORWAY_SOURCES.checklist, NORWAY_SOURCES.sua, NORWAY_SOURCES.police] },
  { category: "Porezi i svakodnevica", items: [NORWAY_SOURCES.tax, NORWAY_SOURCES.health, NORWAY_SOURCES.bankid] },
];
