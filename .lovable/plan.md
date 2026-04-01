

## Plan: Settings Dropdown with Onboarding & Logout

### What
Replace the single Settings icon button (line 122-124) with a dropdown menu that has two options:
1. **Podešavanja** (Settings/Onboarding) — navigates to `/onboarding`
2. **Odjavi se** (Logout) — signs out and redirects to `/auth`

### How

**File: `src/pages/DashboardPage.tsx`**

1. Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`, and `LogOut` from `lucide-react`.

2. Replace the Settings `<Button>` (lines 122-124) with a `DropdownMenu` containing:
   - Trigger: the same Settings icon button
   - Menu item 1: `<Settings icon> Podešavanja` → `navigate("/onboarding")`
   - Menu item 2: `<LogOut icon> Odjavi se` → `await signOut(); navigate("/auth")`

3. Destructure `signOut` from `useAuth()` (already imported on line 67).

