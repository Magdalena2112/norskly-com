## Šta je problem

Faza 1 je dodala "nevidljivu" infrastrukturu (kolona `language`, hook `useSelectedLanguage`, parametrizovani `reading-ai`/`grammar-ai`), ali **u UI nigde ne vidiš da postoji engleski**:

- `/practice` i `/ucenje/:slug` renderuju **isti** `DashboardPage`, koji je hardkodovan na norveški (npr. "Velkommen tilbake til fjordene", "Norsk grammatikk", "Snakk med AI", "Lærer-time").
- Ne postoji **switcher** za promenu jezika unutar studentskog dela.
- Ne postoji vidljiv ulaz iz landing-a u engleski dashboard (samo preko `/jezici/engleski` → trial flow).

Zato deluje kao da engleski "ne postoji".

## Plan – učiniti engleski vidljivim (samo frontend, bez nove logike)

### 1. Centralizovati prevode po jeziku
Proširiti `src/lib/languages.ts` mapom UI stringova po `code` (`no` | `en`):
- hero pozdrav i podnaslov dashboard-a
- podnaslovi modula (Gramatika → "Norsk grammatikk" / "English grammar", Razgovor → "Snakk med AI" / "Talk with AI", Pisanje → "Skriving & bildebeskrivelse" / "Writing & picture description", Čitanje → "Lesing & forståelse" / "Reading & comprehension", Profesor → "Lærer-time" / "Teacher session")
- mali "stamp" na hero kartici (LOFOTEN → LONDON za EN)
- script linija ("Velkommen tilbake til fjordene" → "Welcome back")

Sav primarni UI tekst (Gramatika, Vokabular, dugmad, opisi na srpskom) ostaje **na srpskom** — menja se samo deo koji je već bio na norveškom.

### 2. `DashboardPage` čita aktivan jezik
- `useSelectedLanguage()` u `DashboardPage`, pa `modules[]` i hero kopiju računati iz mape iz koraka 1.
- Ako je ruta `/ucenje/:slug`, sinhronizovati `localStorage` jezik iz `slug`-a pre rendera (slično kao u `LanguagePage`).

### 3. Vidljiv language switcher u `StudentLayout`
Mali dropdown pored avatara/menija sa zastavicama (🇳🇴 Norveški / 🇬🇧 Engleski; nemački disabled "Uskoro"):
- menja `localStorage` + dispečuje `language-changed`
- redirektuje na `/ucenje/<slug>` da se ruta i stanje poklope
- vidljiv na svakoj studentskoj stranici (Dashboard, Grammar, Reading, Progress, …)

### 4. Onboarding upisuje izabrani jezik
U `OnboardingPage` (i `LanguagePage` flow) — kada user izabere jezik na landing-u, on se već čuva u `localStorage`. Dodati: po završetku onboarding-a redirect na `/ucenje/<slug>` umesto `/practice`, da prvi utisak bude "vidim engleski dashboard".

### 5. Hero/postcard vizuelni hint po jeziku
- Za EN, hero pozadinski stamp prikazuje "LONDON · 1909" umesto "LOFOTEN · 1909" (samo tekst u istom postojećem stilu, bez novih asseta).
- Script linija prevedena (vidi korak 1).

## Šta NE radimo u ovoj iteraciji
- Ne diramo `talk-ai`, `vocabulary-ai`, `writing-correct` (to je Faza 2 prema dogovoru).
- Ne menjamo postojeće UI stringove na srpskom.
- Ne dodajemo nove module ni profesore.

## Fajlovi koji se menjaju
- `src/lib/languages.ts` — dodati `ui` mapu (hero + module subtitles po jeziku)
- `src/pages/DashboardPage.tsx` — dinamični tekstovi + sync iz `:slug`
- `src/components/student/StudentLayout.tsx` — dodati `LanguageSwitcher`
- `src/components/student/LanguageSwitcher.tsx` — nova komponenta (dropdown sa zastavicama)
- `src/pages/OnboardingPage.tsx` — redirect na `/ucenje/<slug>` na kraju

## Rezultat
Kad user odabere "Engleski" (sa landinga, switcher-a u dashbordu ili završi onboarding sa EN), odmah vidi:
- URL `/ucenje/engleski`
- hero "Welcome back" + EN stamp
- module subtitles na engleskom (English grammar, Reading & comprehension…)
- Reading i Grammar module već prave EN sadržaj (Faza 1 već urađeno)
- istoriju filtriranu na EN sesije
