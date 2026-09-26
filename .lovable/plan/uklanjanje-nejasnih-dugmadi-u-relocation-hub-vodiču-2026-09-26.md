# Uklanjanje nejasnih dugmadi u Relocation Hub vodiču

Dugmad ispod koraka, poput „Proveri uslove“, sada samo otvaraju prvu sledeću zatvorenu temu u istom koraku. Zato deluju kao da ne rade ono što im naziv obećava; ponovni klik otvara drugu temu umesto da izvrši proveru.

## Izmena
- Ukloniti samo završna dugmad ispod koraka vodiča, za Norvešku i Nemačku.
- Zadržati naslove tema koji se otvaraju klikom, linkove ka zvaničnim izvorima, navigaciju kroz korake i listu za pripremu odlaska.
- Proveriti oba prikaza na telefonu i računaru: nema završnih dugmadi, teme i linkovi rade kao ranije.

## Tehnički detalji
- Ukloniti `onCta` prikaz u `StepShell` i `openFirst` vezu u `Roadmap`; ne menjati podatke o zemljama ni sadržaj vodiča.
