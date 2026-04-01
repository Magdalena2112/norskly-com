

## Skip Onboarding for Admin Users

### Problem
When an admin logs in, `ProtectedRoute` checks `localStorage` for `norskly_onboarding_done` and redirects to `/onboarding` if not set. Admins shouldn't go through the student onboarding flow.

### Solution
Modify `ProtectedRoute` to use the `useUserRole` hook. If the user has the `admin_teacher` role, skip the onboarding redirect entirely and let them proceed to admin pages.

### Changes

**`src/components/ProtectedRoute.tsx`**
- Import `useUserRole` hook
- After auth check, if `isAdmin` is true, skip the onboarding redirect
- Only redirect to `/onboarding` for non-admin users who haven't completed it
- Handle the role loading state alongside auth loading

### Technical Detail
```text
Current flow:
  Login → ProtectedRoute → onboarding check → redirect to /onboarding (ALL users)

New flow:
  Login → ProtectedRoute → role check →
    admin_teacher? → skip onboarding → render children
    student?       → onboarding check → redirect if needed
```

Single file change, minimal and safe.

