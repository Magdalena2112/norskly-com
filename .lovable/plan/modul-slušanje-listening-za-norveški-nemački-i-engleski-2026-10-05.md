# Modul Slušanje (Listening) za norveški, nemački i engleski

## Šta učenik dobija
- Nova kartica **„Slušanje"** na kontrolnoj tabli i u bočnom meniju, u istom stilu kao ostali moduli.
- Stranica sa karticama aktivnosti: naslov, kratak opis, nivo (A1–B2), tema, trajanje, napredak i oznaka „završeno".
- Filteri: nivo, tema, završeno / nezavršeno.
- Stranica aktivnosti: veliki audio plejer (pusti/pauza, ponovo, traka napretka, vreme, jačina zvuka, brzina 0.75x / 1x / 1.25x) i dugme „Prikaži / sakrij transkript" (podrazumevano sakriven).
- 8 tipova vežbi: Slušaj i razumi, Višestruki izbor, Tačno/netačno, Popuni praznine, Izaberi šta si čuo, Poveži, Dijalog, Slušaj i ponovi (za sada samo struktura, kasnije vezano za Razgovor).
- Odmah posle odgovora: tačno/netačno, tačan odgovor, kratko objašnjenje, dugme da se ponovo pusti deo snimka.
- Na kraju: rezultat, broj tačnih, status, „Pokušaj ponovo" i „Sledeća aktivnost". XP se dodeljuje kao u drugim modulima.
- Sadržaj i napredak su potpuno odvojeni po jeziku.

## Početni sadržaj
Da modul ne bi bio prazan, dodaću nekoliko primera aktivnosti po jeziku (po jednu-dve po nivou, različiti tipovi). Audio se generiše jednom pomoću AI glasa i čuva u skladištu; kasnije se mogu dodavati prave snimke.

## Tehnički detalji
- Tabela `listening_activities`: id, language, title, description, cefr_level, topic, activity_type, audio_url, transcript, segments (jsonb, vremenski delovi za ponovno puštanje), questions (jsonb, uključuje odgovore i objašnjenja), duration_seconds, difficulty, is_published, plus nullable `course_id`, `chapter_id`, `lesson_id` (bez veza sada) za kasnije povezivanje. Čitanje za prijavljene korisnike, izmene samo admin.
- Tabela `listening_progress`: user_id, activity_id, language, status, score, total, answers (jsonb), attempts, completed_at; jedinstveno (user_id, activity_id). RLS po vlasniku; admin/profesor uz postojeću logiku saglasnosti.
- Opisi težine po nivou u jednom konfiguracionom fajlu (ne u svakoj aktivnosti).
- Pravilno ocenjivanje u kodu po tipu vežbe kroz registar komponenti (`activity_type` → renderer + grader), tako da novi tip ne zahteva prepravku modula.
- Rute `/listening` i `/listening/:activityId`, lazy učitane; jezik iz postojećeg `useSelectedLanguage`.
- Audio: javni bucket `listening-audio`; jednokratna skripta generiše TTS (podrazumevani govorni model) i upisuje početne aktivnosti.
- `logActivity` dobija modul `"listening"`; sva UI dokumentacija na srpskom, sadržaj na ciljanom jeziku.
- AGENTS.md: pravilo o registru tipova vežbi i odvojenosti po jeziku.
