/** Guidance for Serbian citizens considering work and relocation to Germany; official sources take precedence. */
export interface GermanySource { label: string; url: string }
export interface GermanyTopic {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  source?: GermanySource;
}

export const GERMANY_SOURCES = {
  embassy: { label: "Ambasada Nemačke u Beogradu – vize", url: "https://belgrad.diplo.de/rs-sr/service/visa-einreise" },
  visit: { label: "Ambasada Nemačke – kratkoročni boravak", url: "https://belgrad.diplo.de/rs-de/service/05-visaeinreise/00-faq" },
  westBalkan: { label: "Ambasada Nemačke – Regulativa za Zapadni Balkan", url: "https://belgrad.diplo.de/rs-sr/service/visa-einreise/aufenthalteueber90tage/erwerbstaetigkeit/keinefachkraefte/westbalkan" },
  qualified: { label: "Make it in Germany – kvalifikovani radnici", url: "https://www.make-it-in-germany.com/en/visa-residence/types/work-qualified-professionals" },
  experienced: { label: "Make it in Germany – radnici sa iskustvom", url: "https://www.make-it-in-germany.com/en/visa-residence/types/visa-professionally-experienced-workers" },
  opportunity: { label: "Make it in Germany – vrste viza i Opportunity Card", url: "https://www.make-it-in-germany.com/en/visa-residence/types" },
  visa: { label: "Savezna služba za rad – izbor vize", url: "https://www.arbeitsagentur.de/en/working-in-germany/visa" },
  jobs: { label: "Savezna služba za rad – traženje posla", url: "https://www.arbeitsagentur.de/en/working-in-germany/how-to-find-a-job" },
  recognition: { label: "Anerkennung in Deutschland – Recognition Finder", url: "https://www.anerkennung-in-deutschland.de/en/interest/finder/profession" },
  recognitionVisa: { label: "Make it in Germany – viza za priznavanje kvalifikacija", url: "https://www.make-it-in-germany.com/en/visa-residence/types/recognition" },
  registration: { label: "Bundesportal – prijava adrese", url: "https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99115005104001" },
  insurance: { label: "Make it in Germany – novac i osiguranje", url: "https://www.make-it-in-germany.com/en/living-in-germany/money-insurance" },
  bank: { label: "Make it in Germany – bankovni račun", url: "https://www.make-it-in-germany.com/en/living-in-germany/money-insurance/bank-account" },
  social: { label: "Make it in Germany – socijalno osiguranje", url: "https://www.make-it-in-germany.com/en/living-in-germany/back-to-germany/social-security" },
} satisfies Record<string, GermanySource>;

export const GERMANY_GUIDE: Record<string, { intro?: string; topics: GermanyTopic[] }> = {
  uslovi: {
    intro: "Ako imaš biometrijski pasoš Srbije, kratka poseta bez vize nije isto što i dozvola za zaposlenje. Put zavisi od ponude za posao, kvalifikacija i vrste profesije; ovo su polazne mogućnosti, ne procena ispunjenosti uslova.",
    topics: [
      { title: "Kratka poseta nije dozvola za rad", paragraphs: ["Bezvizni režim omogućava kratke turističke, poslovne ili privatne posete prema važećim pravilima, ali ne i uobičajeno zaposlenje. Za rad proveri odgovarajuću vizu pre odlaska."], source: GERMANY_SOURCES.visit },
      { title: "Put A · Qualified Professional", paragraphs: ["Ako imaš konkretnu ponudu za kvalifikovani posao i kvalifikaciju priznatu ili uporedivu u Nemačkoj, proveri vizu za kvalifikovane radnike. Za regulisane profesije potrebna je i odgovarajuća profesionalna dozvola."], source: GERMANY_SOURCES.qualified },
      { title: "Put B · Western Balkans Regulation", paragraphs: ["Za državljane Srbije postoji put do zaposlenja i bez priznavanja stručne kvalifikacije za veliki broj poslova. Regulisane profesije i dalje zahtevaju potrebne profesionalne dozvole. Dostupnost i postupak proveri na stranici Ambasade."], source: GERMANY_SOURCES.westBalkan },
      { title: "Put C · Professionally Experienced Worker", paragraphs: ["Ako imaš kvalifikaciju koju priznaje država u kojoj je stečena i relevantno profesionalno iskustvo, za određena neregulisana zanimanja može postojati put bez punog nemačkog priznavanja. Proveri i ostale uslove za ovaj tip vize."], source: GERMANY_SOURCES.experienced },
      { title: "Put D · Opportunity Card", paragraphs: ["Ako još nemaš ponudu za posao, proveri Chancenkarte (Opportunity Card). Mogućnosti obuhvataju priznatu kvalifikaciju ili sistem bodovanja; proveravaju se i sredstva za izdržavanje. Aktuelni iznos i uslove potraži na zvaničnom portalu."], source: GERMANY_SOURCES.opportunity },
      { title: "Imaš ponudu za posao?", paragraphs: ["Ako imaš ponudu, uporedi uslove za kvalifikovane radnike, Regulativu za Zapadni Balkan i radnike sa iskustvom. Ako je nemaš, proveri Opportunity Card. Ovo nije automatska preporuka vize: konačan izbor zavisi od svih tvojih okolnosti."], source: GERMANY_SOURCES.visa },
    ],
  },
  posao: {
    intro: "Traženje posla započni na zvaničnim portalima i proveri uslove ponude pre nego što je prihvatiš.",
    topics: [
      { title: "Gde tražiti posao", paragraphs: ["Savezna služba za rad (Bundesagentur für Arbeit) nudi oglase i besplatnu podršku kandidatima iz inostranstva. Make it in Germany je zvanični portal za posao, vize, kvalifikacije i život u Nemačkoj."], source: GERMANY_SOURCES.jobs },
      { title: "CV i prijava", paragraphs: ["Prilagodi CV i motivaciono pismo konkretnom oglasu. Poslodavac navodi koja dokumenta i jezik prijave traži; proveri legitimnost oglasa i firme."], source: GERMANY_SOURCES.jobs },
      { title: "Pre prihvatanja ponude", bullets: ["Naziv posla, mesto rada i datum početka", "Bruto plata, radno vreme i probni period", "Trajanje ugovora, godišnji odmor i otkazni rok", "Da li profesija zahteva priznanje ili licencu", "Koji put za vizu poslodavac planira da koristi"], source: GERMANY_SOURCES.visa },
      { title: "Prethodna saglasnost za Zapadni Balkan", paragraphs: ["Kod Regulative za Zapadni Balkan budući poslodavac može zatražiti prethodnu saglasnost (Vorabzustimmung) Savezne službe za rad pre tvog zahteva za vizu. Proveri korake i aktuelne instrukcije Ambasade."], source: GERMANY_SOURCES.westBalkan },
    ],
  },
  diploma: {
    intro: "Prvo proveri da li je tvoje zanimanje regulisano. Potreba za priznavanjem kod drugih zanimanja zavisi od izabranog puta za rad i vizu.",
    topics: [
      { title: "Regulisana ili neregulisana profesija", paragraphs: ["Zdravstvene, nastavničke i druge regulisane profesije mogu zahtevati priznanje kvalifikacije i dozvolu za rad u struci. Za neregulisane profesije uslov priznavanja zavisi od vrste vize; ne pretpostavljaj da isti uslov važi za sve."], source: GERMANY_SOURCES.recognition },
      { title: "Recognition Finder", paragraphs: ["Na portalu Anerkennung in Deutschland izaberi profesiju i mesto rada. Pronaći ćeš nadležni organ, potrebna dokumenta i postupak koji odgovara tvojoj situaciji."], source: GERMANY_SOURCES.recognition },
      { title: "Postupak i mogući ishod", paragraphs: ["Nadležni organ upoređuje tvoje obrazovanje sa odgovarajućom nemačkom kvalifikacijom. Rezultat može biti potpuno ili delimično priznanje; kod razlika mogu biti potrebni dodatna obuka ili ispit. Trajanje zavisi od organa i potpunosti dokumentacije."], source: GERMANY_SOURCES.recognitionVisa },
      { title: "Dokumenta za priznanje", bullets: ["Diploma, svedočanstva i opis trajanja i sadržaja školovanja", "Dokazi o iskustvu, licenca ili profesionalna ovlašćenja kada su relevantni", "CV, identifikacioni dokument i prevodi ili overene kopije ako ih nadležni organ traži"], source: GERMANY_SOURCES.recognition },
    ],
  },
  dokumenta: {
    intro: "Ovo je orijentaciona lista. Konačnu listu, obrasce i način predaje uvek proveri za baš svoju viznu kategoriju na sajtu Ambasade Nemačke u Beogradu.",
    topics: [
      { title: "Lična dokumenta", bullets: ["Važeći pasoš i fotografije prema uputstvu za izabranu vizu", "VIDEX ili digitalni zahtev kada je predviđen za tvoju kategoriju"], source: GERMANY_SOURCES.embassy },
      { title: "Dokazi o zaposlenju", bullets: ["Ugovor ili konkretna ponuda za posao", "Izjava poslodavca o zaposlenju kada je potrebna", "Prethodna saglasnost Savezne službe za rad ako je relevantna"], source: GERMANY_SOURCES.westBalkan },
      { title: "Kvalifikacije", bullets: ["Diplome i svedočanstva", "Odluka o priznavanju ili delimičnom priznanju kada se traži", "Profesionalna dozvola za regulisanu profesiju, ako je potrebna", "Prevodi ili apostil samo prema uputstvu za konkretan zahtev"], source: GERMANY_SOURCES.recognition },
      { title: "Dodatna dokumentacija", bullets: ["Dokaz o jeziku, osiguranju ili sredstvima za izdržavanje kada se traži", "Dokaz o smeštaju i druga dokumenta ako su navedena u tvojoj checklisti"], paragraphs: ["Ambasada može tražiti dodatnu dokumentaciju za konkretan slučaj."], source: GERMANY_SOURCES.embassy },
    ],
  },
  dozvola: {
    intro: "Za zaposlenje proveri odgovarajuću nacionalnu vizu pre početka rada. Bezvizna poseta sama po sebi nije dozvola za rad.",
    topics: [
      { title: "01 · Izaberi viznu kategoriju", paragraphs: ["U zavisnosti od situacije proveri vizu za kvalifikovane radnike, EU Blue Card, Regulativu za Zapadni Balkan, radnike sa iskustvom, priznavanje kvalifikacija ili Opportunity Card. Svaka ima različite uslove."], source: GERMANY_SOURCES.opportunity },
      { title: "02 · Prati checklistu za svoju kategoriju", paragraphs: ["Pripremi dokumenta i obrasce koje Ambasada navodi baš za tvoj put. Rokove, takse i iznos u dinarima proveri neposredno pre podnošenja; mogu se promeniti."], source: GERMANY_SOURCES.embassy },
      { title: "03 · Podnesi zahtev", paragraphs: ["Mesto i način predaje mogu zavisiti od kategorije: centar za prijem zahteva, vizno odeljenje ili digitalni portal. Zakaži termin i prati aktuelno uputstvo Ambasade."], source: GERMANY_SOURCES.embassy },
      { title: "04 · Ako koristiš Regulativu za Zapadni Balkan", paragraphs: ["Budući poslodavac može unapred zatražiti saglasnost Savezne službe za rad; zatim podnosiš zahtev za vizu sa traženom dokumentacijom. Priznavanje kvalifikacije po ovoj ruti nije opšti uslov, ali regulisane profesije zadržavaju svoje uslove."], source: GERMANY_SOURCES.westBalkan },
    ],
  },
  "pre-odlaska": {
    intro: "Pre putovanja pripremi važna dokumenta i plan za prve nedelje boravka.",
    topics: [
      { title: "Dokumenta za put", bullets: ["Pasoš, odgovarajuća viza i ugovor o radu", "Diplome, sertifikati i odluka o priznavanju, ako je potrebna", "Dokaz o zdravstvenom osiguranju, originali i kopije važnih dokumenata"] },
      { title: "Smeštaj i prijava adrese", paragraphs: ["Proveri da li smeštaj omogućava prijavu adrese (Anmeldung) i da li stanodavac izdaje Wohnungsgeberbestätigung. Tačni uslovi prijave zavise od nadležne lokalne službe."], source: GERMANY_SOURCES.registration },
      { title: "Osiguranje i finansijska rezerva", paragraphs: ["Proveri kako ćeš imati zdravstveno pokriće od ulaska do početka redovnog osiguranja, bez praznine u pokriću. Pripremi sredstva za depozit, kiriju, prevoz, hranu i prve troškove do plate."], source: GERMANY_SOURCES.insurance },
    ],
  },
  "nakon-dolaska": {
    intro: "Po dolasku proveri lokalne postupke i datume važenja vize. Redosled zavisi od tvog statusa i grada.",
    topics: [
      { title: "01 · Anmeldung — prijava adrese", paragraphs: ["Prijavi adresu kod nadležnog Bürgeramt-a ili Meldebehörde u roku koji važi za tvoje mesto. Obično su potrebni pasoš i potvrda stanodavca (Wohnungsgeberbestätigung); proveri i lokalni obrazac. Nakon prijave dobijaš Meldebescheinigung."], source: GERMANY_SOURCES.registration },
      { title: "02 · Boravišna dozvola (Aufenthaltstitel)", paragraphs: ["Proveri koliko važi ulazna viza i, kada je potrebno, podnesi zahtev za odgovarajuću boravišnu dozvolu lokalnoj službi za strance (Ausländerbehörde) pre njenog isteka."], source: GERMANY_SOURCES.opportunity },
      { title: "03 · Poreski identifikacioni broj (Steuer-ID)", paragraphs: ["Nakon prijave adrese proveri dostavljanje poreskog identifikacionog broja poštom. Sačuvaj ga i dostavi poslodavcu; ako ne stigne, obrati se nadležnoj poreskoj službi."], source: GERMANY_SOURCES.registration },
      { title: "04 · Zdravstveno osiguranje", paragraphs: ["Proveri da li prema svom statusu pripadaš javnom ili privatnom sistemu i kada pokriće počinje. Za zaposlene se doprinosi obično obračunavaju kroz zaradu, ali izbor i uslovi zavise od situacije."], source: GERMANY_SOURCES.insurance },
      { title: "05 · Socijalno osiguranje", paragraphs: ["Za zaposlenje koje podleže doprinosima, poslodavac obično prijavljuje zaposlenog u odgovarajuće sisteme. Proveri prijavu i podatke na platnom listiću."], source: GERMANY_SOURCES.social },
      { title: "06 · Bankovni račun", paragraphs: ["Za platu i svakodnevne troškove praktičan je tekući račun (Girokonto). Banka može tražiti pasoš, dokaz o adresi, boravišni status i dokaz o primanjima, zavisno od računa."], source: GERMANY_SOURCES.bank },
      { title: "07 · Početak rada", bullets: ["Dostavi poslodavcu potrebne podatke o računu, porezu i osiguranju.", "Proveri da je tvoje pravo na rad usklađeno sa vizom ili boravišnom dozvolom.", "Sačuvaj ugovor, prijavu i platne listiće."], source: GERMANY_SOURCES.visa },
    ],
  },
};

export const GERMANY_BEFORE_LEAVING = [
  "Pasoš, viza i ugovor o radu", "Diplome, sertifikati i odluka o priznavanju, ako je potrebna",
  "Zdravstveno pokriće za put i početak boravka", "Originali i kopije važnih dokumenata",
  "Smeštaj koji omogućava prijavu adrese", "Provera potvrde stanodavca (Wohnungsgeberbestätigung)",
  "Novac za depozit i prvu kiriju", "Finansijska rezerva do prve plate",
];

export const GERMANY_LINK_GROUPS = [
  { category: "Vize i rad", items: [GERMANY_SOURCES.embassy, GERMANY_SOURCES.westBalkan, GERMANY_SOURCES.visa] },
  { category: "Posao i dolazak", items: [GERMANY_SOURCES.jobs, GERMANY_SOURCES.opportunity] },
  { category: "Kvalifikacije", items: [GERMANY_SOURCES.recognition, GERMANY_SOURCES.qualified] },
  { category: "Administracija i život", items: [GERMANY_SOURCES.registration, GERMANY_SOURCES.insurance, GERMANY_SOURCES.bank] },
];
