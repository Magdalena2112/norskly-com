# Prijavi se / Registruj se u zaglavlju

## Šta se menja
Samo zaglavlje početne stranice (`src/pages/LandingPage.tsx`, nav deo) i mala izmena na stranici
za prijavu/registraciju (`src/pages/AuthPage.tsx`) da dugme otvori pravu karticu.

## Desna strana zaglavlja (računar)
Trenutno postoji samo diskretno „Prijava" (vidljivo od širokih ekrana) + primarno „Započni besplatno".
Zamenjujemo sa tri akcije:

- **Prijavi se** — diskretno dugme (ghost stil), otvara stranicu za prijavu
- **Registruj se** — primarno dugme, otvara stranicu sa karticom Registracija
- **Započni besplatno** — ostaje kao što je, vodi na izbor jezika

Na užim računarskim širinama (tablet) „Prijavi se" se sakriva prvi, pa ostaju dva dugmeta —
isti princip koji je već korišćen da meni ne bude odsečen.

## Mobilni ekran
Bez hamburger menija — sva tri dugmeta ostaju vidljiva u zaglavlju, ali kompaktna (manja slova i
razmaci) da zajedno sa logom stanu na 390px. Ako ne staje u redu, smanjujemo samo veličinu dugmadi,
ne uklanjamo nijedno.

## Kartica na stranici za prijavu
Stranica `/auth` već ima prekidač „Prijava"/„Registracija". Dodajemo podršku da dugme
„Registruj se" otvori odmah karticu Registracija (`?mode=signup`), dok „Prijavi se"
ostaje na podrazumevanoj Prijavi.

## Provera
- `tsgo --noEmit -p tsconfig.app.json` i build.
- Playwright: 1280×1800, 867 i 768, 390×844 — nijedno dugme nije odsečeno, nema horizontalnog
  prelijevanja; klik „Registruj se" otvara karticu Registracija, „Prijavi se" karticu Prijava.
