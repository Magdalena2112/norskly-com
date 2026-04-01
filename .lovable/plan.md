

## Popravka: Nivo jezika se resetuje pri svakom loginu

### Problem
`ProfileContext` učitava podatke **isključivo iz localStorage-a**. Kada se korisnik uloguje na drugom uređaju, u drugom pregledaču, ili nakon brisanja keša — localStorage je prazan, pa se profil vraća na podrazumevane vrednosti (A1, itd.). Podaci su sačuvani u bazi (`profiles` tabela), ali se nikada ne čitaju odatle.

### Rešenje
Prilikom inicijalizacije `ProfileProvider`-a, učitati profil iz baze ako je korisnik ulogovan, i sinhronizovati sa localStorage-om.

### Izmene

**`src/context/ProfileContext.tsx`**
- Dodati `useEffect` koji pri mountovanju (i promeni `user`) poziva `supabase.from("profiles").select(...)` za ulogovanog korisnika
- Mapirati kolone iz baze (`display_name`, `level`, `learning_goal`, `focus_area`, `confidence_level`) na `UserProfile` tip
- Ažurirati state i localStorage sa podacima iz baze
- Dodati `loading` flag da DashboardPage ne prikaže default podatke pre učitavanja

**`src/context/ProfileContext.tsx` interface**
- Dodati `loading: boolean` u `ProfileContextType`

**`src/pages/DashboardPage.tsx`**
- Koristiti `loading` iz `useProfile()` da prikaže loader dok se profil ne učita iz baze

### Tok podataka nakon popravke
```text
Korisnik se uloguje
  → ProfileProvider se mountuje
  → useEffect učitava profil iz baze
  → state + localStorage se ažuriraju
  → Dashboard prikazuje tačan nivo (npr. B1)
```

3 fajla: `ProfileContext.tsx`, `types/profile.ts` (bez promena), `DashboardPage.tsx` (minor).

