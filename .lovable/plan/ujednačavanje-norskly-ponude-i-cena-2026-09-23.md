# Ujednačavanje Norskly ponude i cena

## Cilj
Zameniti postojeće različite prikaze ponude na početnoj i svim trima jezičkim stranicama jednom zajedničkom sekcijom, bez promena ostatka stranica ili vizuelnog identiteta.

## Izmene

1. **Napraviti jednu zajedničku pricing/offer sekciju**
   - Izdvojiti postojeće duplirane prikaze iz početne i jezičke stranice u reusable komponentu.
   - Komponenta će koristiti postojeće Norskly kartice, boje, tipografiju, dugmad, ikonice i animacije.
   - Naslovni deo sekcije ostaje prilagodljiv stranici samo gde je potrebno, dok ponuda, cene i pogodnosti ostaju potpuno isti svuda.

2. **Prikazati dve glavne kartice**
   - **Isprobaj Norskly — 0 €** sa tačno pet kratkih pogodnosti, zadatim opisom i CTA tekstom „Počni besplatno“.
   - **Uči uz Norskly** sa obe odmah vidljive cene: **9,90 € / mesečno** i **89 € / godišnje**.
   - Godišnju cenu označiti badge-om „Najisplativije“ i tekstom „Uštedi 29,80 € godišnje“.
   - Prikazati tačno pet glavnih pogodnosti i zadatu napomenu da se časovi profesora dodatno plaćaju.
   - CTA tekst plaćenog plana biće „Započni učenje“.

3. **Dodati zatvorene detalje pogodnosti**
   - Svaka kartica dobija „Pogledaj sve pogodnosti“ sa strelicom koja prati otvoreno/zatvoreno stanje.
   - Detalji nisu otvoreni po učitavanju i otvaraju se bez osvežavanja stranice.
   - Uneti detaljne liste tačno prema dostavljenom tekstu.

4. **Odvojiti podršku profesora od pretplate**
   - Ispod kartica dodati zaseban vizuelni blok „Želiš dodatnu podršku profesora?“ sa zadatim podnaslovom i objašnjenjem.
   - Prikazati tri moguće, a ne garantovane opcije: individualni čas, paket od 4 i paket od 8 časova.
   - Dodati napomenu da cena, trajanje i paketi zavise od profesora i CTA „Pronađi profesora“.

5. **Sačuvati postojeću navigaciju i tok prijave**
   - Na jezičkim stranicama CTA dugmad nastavljaju da čuvaju izabrani jezik i vode kroz postojeću prijavu/onboarding; profesor CTA vodi ka postojećem izboru profesora.
   - Na početnoj stranici CTA dugmad vode korisnika ka postojećem izboru jezika pre prijave, jer jezik još nije izabran.
   - Plaćena ponuda ostaje jedan subscription plan; časovi se više nigde u ovoj sekciji ne predstavljaju kao treći plan.
   - Uskladiti samo oznake izabranog plana koje se prikazuju tokom postojećeg toka, kako se zastareli nazivi „Self-Learning“, „Learning + Lessons“ i „7 dana besplatno“ ne bi vraćali korisniku.

6. **Primena i provera**
   - Zameniti postojeće pricing/offer blokove na `/`, `/jezici/norveski`, `/jezici/engleski` i `/jezici/nemacki` zajedničkom komponentom.
   - Proveriti da su tekst, cene, accordion ponašanje i CTA logika isti na sve četiri stranice.
   - Proveriti desktop raspored sa dve izbalansirane kartice i mobilni raspored sa karticama jednu ispod druge, bez preklapanja ili promene ostatka stranica.

## Tehničke napomene
- Koristiće se postojeće `Button`, `Card`, `Badge` i accordion komponente i semantički stilovi projekta.
- Ne menjaju se baza, stvarna naplata, SEO, rute, fontovi, boje, globalni razmaci niti drugi sadržaj stranica.
- Mesečna i godišnja cena biće obe vidljive bez dodatnog klika; neće se uvoditi lažna checkout logika dok sistem naplate nije deo ovog zahteva.
