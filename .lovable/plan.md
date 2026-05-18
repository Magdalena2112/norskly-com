Plan:

1. Zameniti rizično ručno renderovanje teksta u `src/lib/writingPdf.ts` jedinstvenim sigurnim helperima za tekst:
   - svaki tekst se meri i prelama istim fontom, veličinom i stilom kojim se renderuje
   - `charSpace` se resetuje na 0 pre svakog merenja i pre svakog `text()` poziva
   - ukloniti nepotreban italic iz dugih paragrafa kao što je “Opšti utisak”, jer screenshot pokazuje da baš italic + razmaci pogoršavaju čitljivost

2. Sprečiti horizontalni overflow:
   - uvesti „safe text box“ renderovanje koje nikad ne koristi `maxWidth`/justify u `doc.text()`
   - za svaku liniju dodatno proveriti stvarnu širinu preko `getTextWidth`; ako je i dalje preduga, prelomiti je na manje delove
   - dodati fallback za ekstremno duge reči bez razmaka, da ne izađu van ivica kartice/dokumenta

3. Popraviti vertikalni overflow i page-break logiku:
   - ne dozvoliti da kartica veća od jedne strane nastavi preko dna stranice
   - velike sekcije kao “Greške”, “Vokabular”, “Korisni izrazi” i “Sledeći koraci” renderovati kao bezbedne blokove sa proverom prostora pre svakog reda/grupe
   - po potrebi preći na novu stranu i nastaviti unutar margina, bez teksta preko footera ili ivica

4. Pojednostaviti tipografiju za profesionalan izveštaj:
   - normalan font za duge paragrafe
   - italic samo za kratke pomoćne napomene
   - konzistentan line-height, padding i unutrašnje margine u karticama

5. Ojačati regresione testove:
   - dodati payload sa vrlo dugim srpskim/norveškim paragrafima i dugim rečima bez razmaka
   - proveriti da svaki `text()` poziv ostaje unutar A4 margina
   - proveriti da se ne vraćaju `maxWidth`, justify, `charSpace` ili direktni unsafe `splitTextToSize` pozivi

6. Validacija:
   - pokrenuti ciljane Vitest regresione testove za `writingPdf`
   - proveriti da PDF renderer više nema iste uslove koji su izazivali rastegnut tekst i prelivanje preko ivica.