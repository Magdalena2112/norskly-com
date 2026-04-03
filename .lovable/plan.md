

## Plan: Fix Email Sending After Lesson Booking

### Problem
The `send-transactional-email` edge function uses `authClient.auth.getClaims(token)` (line 68) which does not exist in Supabase JS SDK v2. This causes a 401 Unauthorized response on every call, so no emails are ever sent after booking.

### Fix
Replace `getClaims` with `getUser()` in the JWT validation block of `send-transactional-email/index.ts`.

### Change

**`supabase/functions/send-transactional-email/index.ts`** — lines 63-75

Replace:
```typescript
const authClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
})
const token = authHeader.replace('Bearer ', '')
const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
if (claimsError || !claimsData?.claims) {
  console.error('JWT validation failed', { error: claimsError })
  return new Response(...)
}
```

With:
```typescript
const authClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
})
const { data: { user: authUser }, error: authError } = await authClient.auth.getUser()
if (authError || !authUser) {
  console.error('JWT validation failed', { error: authError })
  return new Response(...)
}
```

Then redeploy the `send-transactional-email` edge function.

No other files need changes. The booking code in `BookLessonPage.tsx` is correct.

