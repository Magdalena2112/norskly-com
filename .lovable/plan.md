## Cilj

Englesko okruženje treba da bude **potpuno nezavisno** od norveškog: progres, greške, XP, istorija vežbi, vokabular i nastavnička istorija — sve po jeziku. Struktura i UX ostaju identični.

Faza 1 je već dodala `language` kolonu u 15 tabela i parametrizovala Reading/Grammar. Ova faza zatvara preostale rupe.

---

## 1. Baza: XP i progres po jeziku

Trenutno `user_xp` ima **jedan red po korisniku** — to znači da je XP deljen između jezika. Treba ga raščlaniti po jeziku.

**Migracija:**
- `user_xp`: dodati kolonu `language text not null default 'no'`, promeniti unique constraint na `(user_id, language)`.
- `award_xp` RPC funkcija: dodati parametar `_language text default 'no'` i koristiti ga u `INSERT/UPDATE/WHERE`.
- `last_daily_bonus_date` se računa po (user, language).

**Postojeći redovi:** ostaju kao `language = 'no'` (norveški progres se čuva).

---

## 2. Frontend: prosleđivati `language` svuda

Svaka tačka koja čita/piše podatke vezane za napredak mora da koristi `useSelectedLanguage().code`:

**Filtriranje po jeziku (`.eq("language", langCode)`):**
- `src/pages/VocabularyPage.tsx` — lista reči, kolekcije
- `src/pages/TalkPage.tsx` — istorija razgovora
- `src/pages/WritingPage.tsx` — istorija vežbi
- `src/pages/ProgressPage.tsx` — sve agregacije (activities, error_events, grammar_sessions, reading_sessions, talk_sessions, writing_exercises)
- `src/components/WeeklyDigest.tsx` — top error topics
- `src/components/XpProgressCard.tsx` — čitanje XP po aktivnom jeziku
- `src/components/grammar/GrammarHistoryTab.tsx`, `GrammarProgressTab.tsx`
- `src/pages/DashboardPage.tsx` — XP widget, brze metrike

**Upis (svako `insert` koje već nema language):**
- `logActivity` (src/lib/logActivity.ts) — prihvata `language` arg, upisuje ga.
- `logErrors` (src/lib/logErrors.ts) — isto.
- Svi pozivi gore-navedenih funkcija prosleđuju trenutni `langCode`.
- Insert-i u: vocabulary_words, vocab_items, word_collections, talk_sessions, writing_exercises, grammar_sessions, grammar_submissions, reading_sessions, saved_explanations — postaviti `language: langCode` u svaki `.insert()`.

**Edge functions:** `talk-ai`, `vocabulary-ai`, `writing-correct` već primaju `language` (Faza 1 plan) — proveriti i parametrizovati ako nedostaje (sistem prompt + jezik odgovora/korekcije).

---

## 3. Nastavnici po jeziku

`teachers.language` već postoji. `SelectTeacherPage` i `BookLessonPage` filtriraju po aktivnom jeziku. `MyLessonsPage` prikazuje samo časove u trenutnom jeziku.

Engleski nastavnici trenutno **ne postoje** (samo arhitektura) — to je u redu, lista će biti prazna sa porukom "Uskoro dolaze nastavnici engleskog".

---

## 4. Onboarding i auto-redirect

**Novi korisnici** (već radi): LanguagePage → plan → register → onboarding → `/ucenje/{slug}`.

**Vraćeni korisnici (LOGIN):**
- U `AuthPage.tsx` posle uspešnog login-a: pročitati `profiles.preferred_language` i redirect na `/ucenje/{preferred_language}`. Fallback: `norveski`.
- `Index.tsx` / root: ako je ulogovan i ima preferred_language, redirect na taj dashboard umesto landing.
- `useSelectedLanguage`: pri loginu sinhronizovati localStorage sa `profiles.preferred_language` (već radi u `ProfileContext`).

**Onboarding state:** `profiles.onboarding_completed` je global (jednom po korisniku) — ne radi se ponovo pri promeni jezika. To je OK, onboarding skuplja CEFR/cilj koji nije vezan za jezik (može se kasnije proširiti per-language ako bude potrebno).

---

## 5. Dashboard

`DashboardPage` već čita aktivni jezik. Dodatno:
- XP kartica čita iz novog `user_xp` filtriranog po language.
- "Brze metrike" (završene vežbe, dan u nizu) — računati iz activities filtriranih po language.

---

## Tehnički sažetak izmena

**Baza (1 migracija):**
- ALTER `user_xp` add language + nov composite unique.
- DROP/CREATE `award_xp(_user_id, _points, _check_daily_bonus, _language)`.

**Frontend (~12 fajlova):**
- Hookovi: `logActivity.ts`, `logErrors.ts` (signatura + insert).
- Stranice: VocabularyPage, TalkPage, WritingPage, ProgressPage, DashboardPage, AuthPage, Index, SelectTeacherPage, MyLessonsPage.
- Komponente: WeeklyDigest, XpProgressCard, GrammarHistoryTab, GrammarProgressTab.

**Edge functions:** provera/dopuna `language` parametra u `talk-ai`, `vocabulary-ai`, `writing-correct`.

---

## Šta NIJE u obimu

- Prevod kompletnog UI-ja na engleski (UI ostaje srpski po dosadašnjoj politici).
- Seed engleskih nastavnika.
- Per-language onboarding (CEFR po jeziku).
- Migracija postojećih norveških podataka (ostaju kao `'no'`).
