

## Čuvanje svih onboarding polja u bazi

### Problem
Dva polja iz onboardinga — `preferred_tone` i `lives_in_norway` — se čuvaju samo u localStorage-u. Tabela `profiles` ih nema, pa se gube pri promeni uređaja/pregledača.

### Rešenje

**1. Migracija baze** — dodati 2 kolone u `profiles`:
```sql
ALTER TABLE public.profiles
  ADD COLUMN preferred_tone text DEFAULT 'opušten',
  ADD COLUMN lives_in_norway boolean DEFAULT false;
```

**2. `src/pages/OnboardingPage.tsx`** — dodati `preferred_tone` i `lives_in_norway` u upsert poziv (linije 62-70).

**3. `src/context/ProfileContext.tsx`** — dodati `preferred_tone` i `lives_in_norway` u SELECT upit i mapiranje iz baze (umesto da koristi localStorage fallback za ta polja).

3 izmene: 1 migracija, 2 fajla.

