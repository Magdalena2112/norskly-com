# Izgovor u lekciji: precizan audio i snimanje u svakoj vežbi

## Šta popravljamo
1. **Neprecizan audio za slova i spelovanje.** AI glas trenutno dobija samo „A" ili „E, M, M, A" uz opštu rečenicu „izgovori prirodno", pa ponekad izgovori nešto drugo ili nejasno. 
2. **Audio u vežbama.** Dugme „Poslušaj" ponekad ne pušta ništa ili kasni, jer se snimak pravi tek u trenutku klika, a ako to ne uspe, nema poruke.
3. **Nema snimanja u svim vežbama.** U vežbama sa izborom odgovora (1, 2, 4, 5, 8) mikrofon se pojavljuje tek posle izbora, pa izgleda kao da snimanja nema.

## Rešenje
- **Gotovi snimci za celu lekciju** (isto kao kod dijaloga): unapred pravimo i čuvamo prirodne snimke za svih 26 slova, svih 26 primera reči, primere spelovanja i svaki zadatak u 10 vežbi. Pušta se trenutno i uvek isto.
- **Precizna uputstva za glas:** za slovo — „izgovori samo naziv engleskog slova, britanski izgovor" (npr. Z = /zed/); za spelovanje — slovo po slovo sa kratkim pauzama; za rečenice — prirodna intonacija (pitanje / izjava jasno različite u vežbi 8).
- **Ručna provera:** preslušavam deo snimaka (pogotovo E/I, G/J, A/R, W, Y, Z) i ponovo pravim one koji nisu tačni.
- **Snimanje uvek vidljivo:** u svakom zadatku svih 10 vežbi, odmah ispod dugmeta „Poslušaj", stoji „Snimi izgovor". AI ocenjuje i daje povratnu informaciju na srpskom. U vežbama sa izborom snimanje je i dalje tu, a vežba se računa kao završena kada je odgovor izabran.
- Ako zvuk ne može da se pusti, prikazuje se poruka umesto tišine; glas pregledača ostaje rezerva.

## Tehnički detalji
- Generisanje snimaka kroz isti TTS model i alat kao za `EN-A1-L01.audio.json`; ključevi se dodaju u isti manifest (speaker `n`), pa ih `speakLines` automatski koristi.
- Za pojedinačna slova AI ocenjivač dobija napomenu da je cilj naziv slova (da „E" ne bude prepoznato kao „he"/„e"), kroz poseban tip mete u `pronunciation-check`.
- `LessonPronunciationTab`: `RecordSlot` se prikazuje za svaki zadatak bez uslova.
- Bez promena u Gramatici, Vokabularu, Slušanju i samostalnom modulu Izgovor.
