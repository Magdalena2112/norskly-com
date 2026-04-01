

## Plan: Add Back Arrow to Every Page

### What
Create a reusable `BackButton` component and add it to pages that don't already have a back navigation arrow. Several pages (Grammar, Vocabulary, Progress, BookLesson, MyLessons, TeacherProfile, AdminStudentDetail) already have back arrows in their headers. The following pages need one added:

- **DashboardPage** — back to landing
- **PracticePage** (also TalkPage) — back to dashboard (has 3 header instances at lines 583, 649, 679)
- **OnboardingPage** — back to previous page
- **AuthPage** — back to landing

Pages intentionally excluded: **LandingPage** (root), **NotFound**, **UnsubscribePage**.

### How

**1. Create `src/components/BackButton.tsx`**
- A small reusable component: ghost button with `ArrowLeft` icon
- Uses `useNavigate(-1)` by default, or accepts an optional `to` prop for explicit route
- Styled consistently: `text-primary-foreground hover:text-primary-foreground/80`

**2. Update `src/pages/DashboardPage.tsx`**
- Add `BackButton` in the header, before the "Norskly" text (left side)

**3. Update `src/pages/PracticePage.tsx`**
- Add `BackButton` (pointing to `/practice` i.e. dashboard) in all 3 header instances (lines ~583, ~649, ~679)
- Import `ArrowLeft` from lucide-react

**4. Update `src/pages/AuthPage.tsx`**
- Add `BackButton` to navigate back to landing page

**5. Update `src/pages/OnboardingPage.tsx`**
- Add `BackButton` using `navigate(-1)` in the top-left corner

