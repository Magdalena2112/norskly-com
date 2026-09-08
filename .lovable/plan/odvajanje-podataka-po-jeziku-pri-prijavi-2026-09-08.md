# Odvajanje podataka po jeziku pri prijavi

## Šta se dešava sada (uzrok problema)

Aplikacija pamti "izabrani jezik" na jednom jedinom mestu u pregledaču (`norskly_selected_language`), a keširan profil učenika se čuva pod jednim ključem (`norskly_profile`) — bez oznake jezika.

Posledice koje si videla:
- Ako je poslednji izbor bio engleski, taj izbor ostaje zapamćen. Pri sledećoj prijavi (`/auth` bez izabranog jezika) `AuthPage` uzima "svežu nameru" iz memorije pregledača i ona **pobeđuje** stvarni izbor — pa te ubaci u engleski, odnosno prikaže engleske podatke iako si htela norveški.
- Čak i kad ruta bude `/ucenje/norveski`, komponente koje čitaju jezik iz memorije (`useSelectedLanguage`, `getCurrentLanguageCode`) mogu i dalje vraćati `en`, pa XP, greške i istorije budu iz pogrešnog jezika.
- Keširan profil (nivo, cilj, fokus) iz prethodnog jezika se prikaže na trenutak (ili trajno, dok se ne osveži) jer se čuva pod zajedničkim ključem.

## Šta menjamo

### 1. Jedan izvor istine za aktivan jezik
- Uvodimo pravilo prioriteta: **ruta (`/ucenje/:slug`) → `?lang=` u URL-u → zapamćen izbor → `profiles.preferred_language` → norveški**.
- `useSelectedLanguage` više ne čita samo memoriju pregledača, nego prvo gleda trenutnu putanju (isti pomoćnik kao u `onboardingStatus.getActiveLanguageCode`) i sinhronizuje memoriju sa rutom.
- `getCurrentLanguageCode()` (koji se koristi van React-a) dobija istu logiku: prvo putanja, pa memorija.

### 2. Prijava vodi na jezik koji je stvarno izabran
- `AuthPage`: "sveža namera" važi **samo** ako je jezik došao iz URL-a (`?lang=`) u toj prijavi. Ako korisnik ode direktno na `/auth`, koristi se `profiles.preferred_language` iz baze, a stari zapamćeni izbor se ignoriše.
- Pri odjavi brišemo `norskly_selected_language` i keširane profile, da izbor iz prethodne sesije ne "curi" u sledeću.

### 3. Keš profila odvojen po jeziku
- Umesto `norskly_profile`, koristimo `norskly_profile_<code>` (`_no`, `_en`, `_de`).
- `ProfileContext` pri promeni jezika prikazuje keš baš tog jezika (ili prazan profil), a ne profil prethodnog jezika.
- `getCurrentPersonalization()` u `src/lib/currentLanguage.ts` čita keš aktivnog jezika.

### 4. Osvežavanje podataka pri promeni jezika
- Svi upiti koji već filtriraju po jeziku dobijaju `language` u ključu keša (React Query), tako da se pri prelasku norveški ↔ engleski podaci ponovo učitaju umesto da se prikaže prethodni rezultat.
- Provera onboardinga (`ProtectedRoute`) već koristi jezik u ključu — ostaje.

### 5. Kratka provera ispravnosti
- Kroz pregledač: prijava sa `/auth?lang=norveski` → norveški dashboard, norveški XP; zatim izbor engleskog → engleski onboarding/dashboard; pa ponovo norveški → norveški podaci bez mešanja.

## Bez izmena baze

`language_profiles`, `user_xp`, sesije i greške već imaju kolonu `language` sa filtriranjem. Problem je isključivo u tome koji jezik aplikacija smatra aktivnim i u zajedničkom kešu — migracija nije potrebna.

## Tehnički detalji (datoteke)

- `src/hooks/useSelectedLanguage.ts` — rezolucija jezika po prioritetu (ruta → URL → memorija), sinhronizacija memorije.
- `src/lib/currentLanguage.ts` — ista rezolucija + keš personalizacije po jeziku.
- `src/pages/AuthPage.tsx` — namera samo iz `?lang=`; inače `profiles.preferred_language`.
- `src/pages/Index.tsx` — usklađivanje sa istim pravilom prioriteta.
- `src/context/ProfileContext.tsx` — keš profila po jeziku, reset pri promeni jezika.
- `src/context/AuthContext.tsx` — brisanje jezičkog i profilnog keša pri odjavi.
- Stranice sa React Query upitima (Dashboard, Progress, Grammar, Vocabulary, Reading, Writing, MyLessons) — dodavanje `language` u `queryKey` gde nedostaje.
