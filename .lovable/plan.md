# Kvalitetniji glas u razgovoru iz lekcije

## Šta se menja
1. **Glas prati ulogu.** Sophie i gospođa Brown dobijaju ženski glas, a gospodin Smith i Liam muški. Slobodan razgovor zadržava sadašnji glas.
2. **Prirodniji i jasniji izgovor za A1.** Glas dobija preciznije uputstvo: britanski izgovor, jasan i malo sporiji tempo za početnike, prirodna intonacija pitanja i kratke pauze između rečenica. Glas ne preuveličava i ne čita ništa osim same replike.
3. **Čita se samo replika sagovornika.** Pre slanja na izgovor uklanjaju se oznake, zvezdice, emoji i srpski delovi, da glas ne bi čitao formatiranje ili prevode.
4. **Prvu repliku situacije možeš da preslušaš.** Uvodna rečenica sagovornika (npr. „Hi! I'm Sophie...") dobija dugme za slušanje, kao i sve ostale replike.
5. **Brže ponovno slušanje.** Već napravljen snimak se pamti, pa drugi klik pušta isti snimak odmah, bez novog čekanja.
6. **Provera.** Preslušaću primere za sva četiri sagovornika i proveriti glas, tempo i da se ne čita ništa suvišno.

## Tehnički detalji
- `TalkScenario` dobija polje `voice` (`f`/`m`). `PracticePage` ga šalje funkciji `talk-voice` uz `level`.
- `talk-voice`: mapa glasova `f: Aoede`, `m: Charon`, podrazumevani `Kore`. Prompt zavisi od nivoa (A1/A2 sporije i jasnije) i traži britanski izgovor za `en`.
- Sređivanje teksta pre izgovora u `extractReply`: samo sekcija `[ODGOVOR]`, bez markdown oznaka i emoji.
- Snimci se čuvaju u memoriji stranice po indeksu poruke (`audioUrls`), a već postojeći se ponovo puštaju.
- Bez promena u slobodnom razgovoru, osim sređivanja teksta.
