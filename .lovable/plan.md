

## Onboarding Only for New Users

### Problem
Currently, onboarding is enforced via `localStorage` (`norskly_onboarding_done`). If a user clears their browser data or switches devices, they're forced through onboarding again. It should only be required for genuinely new users.

### Solution
Add an `onboarding_completed` boolean column to the `profiles` table (default `false`). Check this column in `ProtectedRoute` instead of localStorage. Set it to `true` when onboarding finishes.

### Database Migration
```sql
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Mark existing users as completed (they already went through onboarding)
UPDATE public.profiles SET onboarding_completed = true WHERE display_name IS NOT NULL AND display_name != '';
```

### Frontend Changes

**`src/components/ProtectedRoute.tsx`**
- Replace `localStorage.getItem("norskly_onboarding_done")` with a query to `profiles.onboarding_completed`
- Use React Query to fetch the profile's `onboarding_completed` flag
- Only redirect to `/onboarding` if `onboarding_completed` is `false`

**`src/pages/OnboardingPage.tsx`**
- On completion, update `profiles.onboarding_completed = true` in the database (in addition to existing profile sync)
- Keep localStorage set as a fallback/cache for faster checks

### Flow
```text
New user signs up → trigger creates profile (onboarding_completed=false)
  → ProtectedRoute sees false → redirect to /onboarding
  → completes onboarding → sets onboarding_completed=true in DB
  → never redirected again, regardless of device/browser

Existing user → migration sets onboarding_completed=true
  → never redirected
```

3 files touched: 1 migration, `ProtectedRoute.tsx`, `OnboardingPage.tsx`.

