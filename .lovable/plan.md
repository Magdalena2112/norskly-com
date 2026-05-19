## Cilj

Svaki put kada učenik klikne na jezik (Norveški / Engleski / Nemački), taj izbor se prenosi kroz prijavu/registraciju i vodi ga na učenje baš tog jezika — sa zasebnim onboardingom po jeziku, ali u okviru istog naloga.

## Trenutno ponašanje (problem)

- `LanguagePage` upisuje `norskly_selected_language` i prosleđuje `?lang=` u `/auth`.
- **AuthPage (login)** prepisuje izbor sa `profiles.preferred_language` i vodi korisnika na njegov *stari* jezik, ignorišući novi klik.
- **Index.tsx** isto čita `profiles.preferred_language` i redirektuje pre nego što se URL/local izbor primeni.
- `ProtectedRoute` već pravilno proverava onboarding po jeziku iz URL-a (`/ucenje/:slug`), to ostavljamo.

## Šta menjamo

### 1. `src/pages/AuthPage.tsx`
- Pročitaj `lang` iz query stringa **prvi** (`searchParams.get("lang")`) i tretiraj ga kao "namera korisnika u ovoj sesiji".
- **Login flow**:
  - Ako postoji `lang` iz URL-a (ili `norskly_selected_language` postavljen u ovoj sesiji), koristi ga kao ciljni jezik *umesto* `profiles.preferred_language`.
  - Mapiraj slug → code (`no`/`en`/`de`) i proveri `language_profiles.onboarding_completed` za baš taj jezik.
  - Ako nije onboarded → `navigate("/onboarding")` (OnboardingPage već čita `norskly_selected_language`).
  - Ako jeste → `navigate("/ucenje/<slug>")`.
  - Samo kad nema URL `lang`-a niti svežeg izbora, padaj nazad na `profiles.preferred_language`.
- **Signup flow**:
  - Posle uspešne registracije upiši `preferred_language = selectedLang` u `profiles` (već radi).
  - Dodaj redirect na `/onboarding` (umesto samo toast-a) kada je email auto-potvrđen i sesija postoji; ako nema sesije (treba potvrda emaila), zadrži postojeću poruku.

### 2. `src/pages/Index.tsx`
- Ako je u localStorage postavljen `norskly_selected_language` koji se razlikuje od `profiles.preferred_language`, **prednost daj localStorage izboru** (to je sveža namera klikom na jezik).
- Provera onboardinga već radi po `code` izvedenom iz slug-a — samo treba da koristimo "svež" slug.

### 3. `src/pages/LanguagePage.tsx`
- `goAuth()` za već **ulogovanog** korisnika: umesto `navigate("/practice")`, proveri `language_profiles` za izabrani jezik:
  - ako `onboarding_completed = true` → `/ucenje/<slug>`,
  - inače → `/onboarding` (sa već postavljenim `norskly_selected_language`).
- Ovo pokriva slučaj "već prijavljen korisnik klikne drugi jezik" → ide pravo na onboarding tog jezika.

### 4. (bez izmena, samo potvrda)
- `OnboardingPage` već koristi `norskly_selected_language`, upisuje `language_profiles` sa `language = langCode` i radi `upsert` po `(user_id, language)` — i podržava engleski tekst. Posle završetka invalidira keš onboarding statusa i redirektuje na `/ucenje/<slug>`.
- `ProtectedRoute` već čita aktivan jezik iz URL-a i traži `onboarding_completed` po tom jeziku — bez izmena.

## Bez izmena baze

Šema je već spremna: `language_profiles` ima `(user_id, language)` sa `onboarding_completed` po jeziku. Nikakva migracija nije potrebna.

## Tok korisnika (posle izmena)

```text
[Landing] → klik "Engleski"
  → LanguagePage (postavlja norskly_selected_language=engleski)
  → /auth?lang=engleski
      ├── Nov korisnik: Registracija → profiles.preferred_language=engleski
      │     → /onboarding (engleski tekstovi i koraci)
      │     → /ucenje/engleski
      └── Postojeći korisnik (već imao norveški):
            Login → ignoriše profiles.preferred_language
                  → proverava language_profiles za 'en'
                  → nema → /onboarding (engleski)
                  → /ucenje/engleski
```

## Edge slučajevi

- Korisnik ide direktno na `/auth` bez `?lang=`: ponašanje kao i sada (koristi `profiles.preferred_language`).
- Već ulogovan korisnik koji ima završen onboarding za izabrani jezik: ide direktno na `/ucenje/<slug>` bez ponovnog onboardinga.
- `profiles.preferred_language` se ažurira pri *registraciji* da odražava poslednji izabrani jezik, ali login-flow više ne dozvoljava da on "prepiše" svež klik na drugi jezik.
