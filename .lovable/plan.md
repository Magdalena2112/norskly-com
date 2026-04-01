

## Fix: Mejl potvrde časa ne stiže

### Problem
Lekcije se uspešno zakazuju (poslednja pre 20 min), ali `email_send_log` tabela je potpuno prazna i nema logova za `send-transactional-email` edge funkciju. To znači da edge funkcija nikada nije pozvana ili nikada nije deployovana.

Domen `notify.norskly.com` je verifikovan i spreman. Infrastruktura (cron job, queues) postoji. Problem je gotovo sigurno da **edge funkcija `send-transactional-email` nije deployovana**.

### Plan

**1. Deployovati sve email edge funkcije**
- Deploy: `send-transactional-email`, `process-email-queue`, `handle-email-unsubscribe`, `handle-email-suppression`, `preview-transactional-email`

**2. Testirati edge funkciju direktno**
- Pozvati `send-transactional-email` sa test podacima da se potvrdi da radi

**3. Proveriti `email_send_log` nakon testa**
- Ako se pojavi zapis sa statusom `pending` → funkcija radi, mejlovi će stizati

### Tehnički detalj
Kod u `BookLessonPage.tsx` koristi `.catch()` koji samo loguje grešku u konzolu — korisnik nikad ne vidi da je mejl fejlovao. Nakon deploya, ovo će raditi transparentno.

