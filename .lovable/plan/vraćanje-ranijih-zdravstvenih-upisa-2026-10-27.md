# Vraćanje ranijih zdravstvenih upisa

## Potvrđen problem
Promena pravila upisa dodelila je opšti kurs svim ranijim profilima. U bazi postoje dva neadministratorska profila sa zdravstvenim napretkom nastalim pre promene: jedan za nemački i jedan za norveški. Norveški profil ima i napredak u opštem kursu, pa se prvobitni izbor ne može pouzdano zaključiti samo iz napretka.

## Predložena ispravka
- U administratorskom delu dodati pregled ranijih upisa kojima je zdravstveni napredak sada skriven, sa jezikom i napretkom u oba kursa.
- Administrator potvrđuje koji kurs treba da bude upisan. Za zdravstveni kurs vratiti B1 i postojeći zdravstveni napredak, bez brisanja napretka u drugom kursu.
- Ograničiti ovu mogućnost na profile i zdravstveni napredak koji su postojali pre promene pravila. Ne dodavati učenicima izbor za menjanje kursa.
- Sačuvati ko je odobrio ispravku i prethodni/novi upis. Ne menjati XP ili odgovore na ankete.

## Tehnički detalji
- Ne menjati već primenjenu migraciju 0017. Dodati novu migraciju za administratorski pregled i proverenu, atomsku funkciju oporavka sa strogom serverskom proverom administratorske uloge.
- Kandidat mora imati završen raniji upis, trenutno opšti kurs i zdravstveni napredak pre vremena migracije 0017. Isključiti administratorske i profesorske probe.
- Zadržati postojeće zabrane direktnih promena upisa i pravila pristupa lekcijama, napretku i zaštićenom sadržaju.
- Nakon potvrde osvežiti prikaz upisa; svi postojeći putevi koriste ispravljeni profil.

## Provera
- Testirati da običan učenik ne može da odobri oporavak niti promeni kurs.
- Testirati da noviji profili nisu kandidati i da ponovljena potvrda ne menja napredak ili XP.
- Nakon odobrene ispravke proveriti kao zdravstveni učenik: B1 lekcija i prethodni napredak su vidljivi, opšti kurs je skriven i direktni linkovi ka njemu ostaju odbijeni.

## Potrebna odluka
Kod profila sa napretkom u oba kursa administrator mora potvrditi željeni upis; pregled istorije sam po sebi nije dokaz da učenik treba da izgubi opšti kurs.