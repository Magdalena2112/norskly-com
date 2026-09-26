# Hero lebdeći elementi — sadržaj vezan za Norskly koncept

## Šta se menja
Samo `src/components/FloatingGreetings.tsx` (lebdeći oblačići u hero sekciji početne stranice).
Ostatak hero sekcije (naslov, opis, jezičke pilule, pozadinski slojevi u `LandingPage.tsx`) ostaje netaknut.

## Novi sadržaj oblačića
Zamenjujemo generičke pozdrave (Hei, Hello, Ciao…) mešavinom kratkih reči i par ikonica na engleskom, nemačkom i norveškom:

- **Jezik**: Norsk · Deutsch · English · Språk · Lær · Learn · Speak
- **Posao**: Job · Jobb · Arbeit · CV · Karriere · Interview
- **Preseljenje**: Move · Flytte · Umzug · Visa · Permit · Bolig · Wohnung · Home
- **Zdravstvo**: Doctor · Lege · Arzt · Health · Care
- **Studije**: Study · Lernen · Studere · Notes · Lesson

Ikonice (lucide-react, već korišćene na sajtu): Stethoscope i HeartPulse (zdravstvo),
Suitcase/Luggage i MapPin (preseljenje), GraduationCap (studije), MessagesSquare/Languages (jezik),
Briefcase (posao). 3–5 oblačića sa ikonicom, ostatak samo tekst — bez dužih rečenica.

## Kako izgleda i ponaša se
- Isti sistem varijanti (primary/accent/secondary/sage/cream), font-display i font-script mešavina,
  burgunda/krem/roze/zelena paleta — bez novih boja.
- Parallax, lebdenje, blur po dubini, `prefers-reduced-motion` i `motion-reduce:hidden` ostaju kako jesu.
- Novi `Bubble` tip: `text` ili `icon` (opciono obe — ikonica + kratka reč), ikonica prikazana malo
  (w-4/w-5) pored teksta ili sama u manjoj piluli.
- Oko 12 oblačića raspoređenih ravnomerno: 2 po tematskoj grupi + 3–4 ikonice, ravnomerno levo/desno/gore/dole
  da kompozicija bude uravnotežena i ne zagušena; dubine (0.3–1.2) zadržavamo da dalji budu blagi i mutniji.

## Provera
- `tsgo --noEmit -p tsconfig.app.json` i build.
- Playwright na 1280×1800 i 390×844: oblačići se ne preklapaju sa naslovom/pilulama,
  nema horizontalnog prelijevanja, kompozicija balansirana na obe veličine.
