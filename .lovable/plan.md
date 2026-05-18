## Cilj

Sačuvati izabrani jezik učenika u bazi tako da posle odjave/ponovne prijave ostane aktivan (umesto da zavisi samo od `localStorage`, koji se gubi po uređaju/pregledaču).

## Promene

### 1) Baza — dodati `preferred_language` na `profiles`

- Nova kolona `preferred_language text` na `public.profiles` (nullable, bez default-a da postojeći korisnici ostanu netaknuti).
- Nije potrebna nova RLS politika — postojeća "Users can update own profile" / "view own" pokriva.

### 2) Registracija (`AuthPage.tsx`)

- Pri signup-u već dolazi `?lang=...` iz URL-a (postavlja ga `LanguagePage`/landing). Posle uspešnog `signUp`:
  - Upisati `preferred_language` u `profiles` za novog korisnika (upsert po `user_id`).
- Pri login-u (`signInWithPassword`):
  - Nakon uspeha, pročitati `preferred_language` iz `profiles` i upisati u `localStorage` kao `norskly_selected_language` da UI (stepper, landing) odmah pokazuju izabrani jezik.
  - Ako je prisutan, redirect ide na `/jezici/<slug>` umesto generičkog `/practice` (samo kada korisnik dolazi sa stranice jezika, tj. kad nema drugu nameru). Alternativa: uvek `/practice`, ali postaviti localStorage — predlažem `/practice` kao i sada, samo sa popunjenim jezikom.

### 3) `ProfileContext.tsx`

- Proširiti SELECT da uključi `preferred_language`.
- Kad se učita profil, ako postoji `preferred_language`, sinhronizovati u `localStorage` (`norskly_selected_language`). Ovo pokriva ponovne posete na drugom uređaju.

### 4) `LanguagePage.tsx` / `LandingPage.tsx`

- Bez izmena u ponašanju izbora; postojeći upis u localStorage ostaje (radi za neprijavljene korisnike).
- Po prijavljivanju, vrednost iz baze nadjačava localStorage (tačka 3).

## Tehnički detalji

- Upis u `profiles` posle signup-a: koristiti `supabase.from("profiles").update({ preferred_language }).eq("user_id", user.id)` — red profila već kreira trigger `handle_new_user_profile`.
- Upis posle login-a u `localStorage` događa se i u `AuthPage` (brzi UX) i u `ProfileContext` (kanonski izvor).
- Tip `UserProfile` proširiti opcionim poljem `preferred_language?: string` (opciono — može i bez, ali korisno za buduće reference).

## Šta NIJE u opsegu

- Promena jezika iz podešavanja naloga (možemo dodati kasnije).
- Migracija postojećih korisnika (kolona ostaje NULL dok je sami ne postave).