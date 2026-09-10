/**
 * Shared FAQ content used by the LandingPage FAQ accordion and the FAQPage
 * structured data markup. Keep in sync with the accordion on the homepage.
 */
export const FAQ = [
  { q: "Da li mi je potrebno predznanje?", a: "Ne. Norskly počinje od tvog tačnog nivoa — od potpunog početnika do naprednog." },
  { q: "Koje jezike mogu da učim?", a: "Trenutno norveški, engleski i nemački. Uskoro dodajemo i druge jezike." },
  { q: "Kako se sadržaj prilagođava mom nivou?", a: "Norskly prati tvoj nivo, aktivnosti i napredak kako bi ti ponudio sadržaj i vežbe koje odgovaraju tvojim potrebama. U pojedinim funkcionalnostima koristi se AI kako bi povratne informacije i preporuke bile prilagođenije korisniku." },
  { q: "Mogu li da rezervišem časove sa profesorom?", a: "Da. Uz Časovi + Platforma plan dobijaš 4 individualna časa mesečno." },
  { q: "Mogu li da predajem na Norskly?", a: "Da. Kreiraj profesorski nalog i počni da gradiš svoju bazu učenika." },
];

export function buildFaqPageSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
    url: baseUrl,
  };
}
