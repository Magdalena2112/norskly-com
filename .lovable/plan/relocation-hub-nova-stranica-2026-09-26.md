# Relocation Hub — nova stranica

Samostalna stranica `/relocation-hub` za građane Srbije koji se sele u Norvešku ili Nemačku radi posla. Samo struktura i mesta za sadržaj — bez izmišljenih pravila, taksi ili rokova.

## Šta korisnik vidi

1. **Uvod**: naslov "Relocation Hub", podnaslov "Sve što ti je potrebno za preseljenje u Norvešku ili Nemačku – korak po korak." i dve velike kartice: Norveška i Nemačka. Samo izbor zemlje, bez upitnika.
2. **Nakon izbora zemlje**: traka za navigaciju koja ostaje na vrhu (01 Uslovi → 02 Posao → 03 Diploma → 04 Dokumenta → 05 Dozvola → 06 Pre odlaska → 07 Nakon dolaska → 08 Linkovi). Klik vodi na taj korak, a trenutni korak je istaknut. Na telefonu se traka pomera levo-desno.
3. **Put u 8 koraka** (vertikalna linija sa brojevima; na telefonu jedna kolona):
   - 01 Proveri uslove — 4 teme koje se otvaraju klikom + dugme "Proveri uslove"
   - 02 Pronalaženje posla — 5 tema + "Kako pronaći posao"
   - 03 Diploma i kvalifikacije — 6 tema + "Proveri priznavanje diplome"
   - 04 Priprema dokumentacije — spisak od 10 dokumenata; svaki se otvara sa "Šta je ovo? / Gde se dobija? / Da li se prevodi?" + "Pogledaj kompletnu listu"
   - 05 Viza i boravišna dozvola — 6 koraka u nizu (Prikupi dokumentaciju → … → Dobij dozvolu); svaki sadrži polja: šta uraditi, gde, dokumenta, takse, trajanje, zvanični izvor + "Pogledaj proces prijave"
   - 06 Pre odlaska iz Srbije — spisak za čekiranje (9 stavki) sa pokazateljem "Spreman/na za preseljenje"; čekirane stavke se pamte u pregledaču, posebno za svaku zemlju
   - 07 Prvi koraci nakon dolaska — različiti koraci za Norvešku (D-number, poreska kartica, BankID…) i Nemačku (Anmeldung, poreski broj…) + "Prvi koraci nakon dolaska"
   - 08 Korisni linkovi — grupe po oblastima za svaku zemlju; svaka stavka: naziv institucije, jedna rečenica, dugme za spoljni link
4. Mesta gde sadržaj još ne postoji jasno piše "Sadržaj uskoro — proveravamo zvanične izvore". Dugmad u koracima za sada samo otvaraju detalje tog koraka (nema novih stranica).
5. Korisni linkovi: ubacujem samo nazive zvaničnih institucija (npr. UDI, NAV, Skatteetaten, HK-dir, Helsenorge, Altinn; Make it in Germany, Auswärtiges Amt, Anerkennung in Deutschland, BAMF, Bundesagentur für Arbeit, BZSt), bez tvrdnji o pravilima. Ako želiš potpuno prazna mesta i za linkove, reci.

## Povezivanje sa početnom
- Dugme "Istraži Relocation Hub →" na početnoj vodi na novu stranicu.
- Izabrana zemlja se čuva u adresi (`?zemlja=norveska`), pa se link može podeliti.
- Stil: postojeći Norskly (bordo, krem, roze, zlatni akcenti), bez velikih blokova teksta.

## Tehnički detalji
- Novo: `src/pages/RelocationHubPage.tsx`, sadržaj u `src/lib/relocationData.ts` (tipizirani podaci po zemlji, placeholder vrednosti), manji delovi u `src/components/relocation/` (CountryPicker, StepNav sa IntersectionObserver, RoadmapStep, DocChecklist, ProcessSteps, ReadinessChecklist sa localStorage, LinksGrid).
- `src/App.tsx`: lazy ruta `/relocation-hub` (javna).
- `LandingPage.tsx`: CTA `href="#relocation-hub"` → `<Link to="/relocation-hub">`.
- SEO: osnovni naslov/opis preko Helmet-a; dodavanje u sitemap/prerender samo ako potvrdiš (ranije je dogovoreno da ga još ne dodajemo).
- Provera: Playwright na 1280×1800 i 390×844, bez horizontalnog prelivanja.
