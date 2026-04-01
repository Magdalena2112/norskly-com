

## Plan: Fix email slanja nakon zakazivanja časa

### Problem
Mejlovi se ne šalju jer `send-transactional-email` edge funkcija nikada nije pozvana od strane klijenta. U edge function logovima postoji samo jedan test poziv (moj), a `email_send_log` tabela je potpuno prazna. Domen je verifikovan, cron job postoji, šabloni su registrovani — problem je u komunikaciji klijent → edge funkcija.

### Uzrok
1. **`verify_jwt = true`** u `config.toml` za `send-transactional-email` može da blokira pozive ako JWT nije pravilno prosleđen
2. **`.catch()` bez `await`** — email pozivi se ne čekaju i greške se gutaju bez traga
3. Ostale edge funkcije (talk-ai, grammar-ai) koriste `verify_jwt = false` i rade

### Plan

**1. Promeniti `verify_jwt` na `false` za `send-transactional-email`**
- U `supabase/config.toml`, postaviti `verify_jwt = false`
- Dodati in-code JWT validaciju (kao što rade ostale funkcije) — ovo je sigurnije jer omogućava bolje error poruke

**2. Dodati in-code autentifikaciju u edge funkciju**
- U `send-transactional-email/index.ts`, dodati `getClaims()` proveru na početku
- Ovo zamenjuje gateway-level JWT validaciju

**3. Popraviti BookLessonPage.tsx — awajtovati email pozive**
- Umesto `supabase.functions.invoke(...).catch(...)`, koristiti `await` sa try/catch
- Logirati greške ali ne blokirati uspešno zakazivanje časa

**4. Ponovo deployovati edge funkciju**
- Deploy `send-transactional-email` sa novim kodom

**5. Testirati pozivom edge funkcije**
- Pozvati funkciju sa test podacima i proveriti da li radi

### Tehnički detalji

**config.toml izmena:**
```toml
[functions.send-transactional-email]
verify_jwt = false
```

**Edge funkcija — dodati auth check:**
```typescript
const authHeader = req.headers.get('Authorization')
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
}
const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
  global: { headers: { Authorization: authHeader } }
})
const { data, error } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''))
if (error || !data?.claims) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
}
```

**BookLessonPage.tsx — pravilno awajtovanje:**
```typescript
// Umesto .catch(), koristiti try/catch sa await
try {
  await supabase.functions.invoke("send-transactional-email", { body: {...} });
} catch (e) {
  console.error("Email failed:", e);
}
```

