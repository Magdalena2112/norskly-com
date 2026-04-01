

## Fix: Onboarding Completion Not Redirecting

### Problem
After completing onboarding, the user gets stuck because:
1. The `profiles.onboarding_completed` upsert is fire-and-forget (`.then()` with no await)
2. `ProtectedRoute` caches `onboarding_completed = false` with `staleTime: Infinity`, so even after the DB update, the cached value still says `false`
3. When `navigate("/practice")` fires, `ProtectedRoute` reads the stale cache and redirects back to `/onboarding`

### Solution
In `OnboardingPage.tsx`:
- **Await** the Supabase upsert so the DB is updated before navigating
- **Invalidate** the `onboarding-status` React Query cache after the upsert succeeds
- Then navigate to `/practice`

### Changes

**`src/pages/OnboardingPage.tsx`**
- Import `useQueryClient` from `@tanstack/react-query`
- Make the `next()` function async
- Await the upsert call
- Call `queryClient.invalidateQueries({ queryKey: ["onboarding-status"] })` before navigating

One file, minimal change.

