

## Role-Based Access System for Norskly

### Overview

Build a comprehensive role-based system with two roles: `admin_teacher` and `student`. The admin_teacher gets a full dashboard with student management, analytics, and lesson slot management. Students are restricted to their own data and learning features. Admin routes are protected with role guards.

### Database Changes

**1. Update `app_role` enum** — Add `admin_teacher` and `student` values, migrate existing `admin` role to `admin_teacher`.

```sql
-- Add new enum values
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin_teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- Update existing admin role to admin_teacher
UPDATE user_roles SET role = 'admin_teacher' WHERE role = 'admin';
```

**2. Create `profiles` table** — Store student names, levels, and metadata for admin viewing.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  level text DEFAULT 'A1',
  learning_goal text DEFAULT '',
  focus_area text DEFAULT '',
  confidence_level integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Students see own profile; admin_teacher sees all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT
  TO authenticated USING (has_role(auth.uid(), 'admin_teacher'));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
```

**3. Update `has_role` function** — Support both `admin` and `admin_teacher` for backward compatibility.

**4. Create admin-readable policies** — Allow admin_teacher to SELECT from `activities`, `error_events`, `grammar_sessions`, `vocab_items`, `vocabulary_words`, `talk_sessions`, `user_xp` for any user.

**5. Auto-assign `student` role on signup** — Database trigger on `auth.users` insert.

**6. Auto-create profile on signup** — Database trigger to create profiles row.

### Frontend Architecture

**New Files:**

| File | Purpose |
|------|---------|
| `src/hooks/useUserRole.ts` | Hook to fetch current user's role from `user_roles` |
| `src/components/AdminRoute.tsx` | Route guard that checks `admin_teacher` role, redirects students to `/practice` |
| `src/pages/AdminDashboardPage.tsx` | Main admin dashboard with summary cards, student list, search/filter |
| `src/pages/AdminStudentDetailPage.tsx` | Detailed student profile view with tabs for activity, progress, errors, lessons |
| `src/components/admin/StudentList.tsx` | Searchable/filterable student table |
| `src/components/admin/StudentSummaryCards.tsx` | Overview metrics (total students, active this week, avg XP, etc.) |
| `src/components/admin/StudentProgressView.tsx` | Progress charts and module breakdown for a student |
| `src/components/admin/StudentErrorAnalysis.tsx` | Frequent mistakes / weak areas for a student |
| `src/components/admin/StudentLessonHistory.tsx` | Booking history for a student |
| `src/components/admin/AdminSidebar.tsx` | Sidebar navigation for admin pages |

**Modified Files:**

| File | Change |
|------|--------|
| `src/App.tsx` | Add new admin routes, wrap admin pages with `AdminRoute` |
| `src/components/ProtectedRoute.tsx` | No change needed (already handles auth) |
| `src/pages/DashboardPage.tsx` | Hide admin nav links for students; show admin dashboard link for admin_teacher |
| `src/pages/AdminLessonsPage.tsx` | Integrate into new admin layout with sidebar |
| `src/pages/AdminAvailabilityPage.tsx` | Integrate into new admin layout with sidebar |
| `src/pages/AdminTeacherProfilePage.tsx` | Integrate into new admin layout with sidebar |
| `src/pages/OnboardingPage.tsx` | Save profile data to `profiles` table in addition to localStorage |

### Implementation Steps

1. **Database migration** — Create `profiles` table, add enum values, add admin-readable SELECT policies to all student data tables, create signup triggers for role assignment and profile creation.

2. **`useUserRole` hook** — Query `user_roles` table for current user, cache with React Query, expose `role`, `isAdmin`, `isStudent`, `loading`.

3. **`AdminRoute` component** — Uses `useUserRole`; if not `admin_teacher`, redirect to `/practice` with toast.

4. **Admin sidebar** — Navigation links: Dashboard, Students, Lessons, Availability, Teacher Profile. Uses shadcn Sidebar component.

5. **Admin Dashboard page** — Summary cards (total students, active this week, total lessons, avg XP). Student list table with search by name/email, filter by level. Click row to navigate to student detail.

6. **Student Detail page** — Route: `/admin/students/:userId`. Tabs: Overview (level, XP, goals), Activity History (from `activities` table), Progress (readiness scores computed same as ProgressPage), Error Analysis (from `error_events`), Lesson History (from `lessons`).

7. **Update existing admin pages** — Wrap in shared admin layout with sidebar.

8. **Student route protection** — Students hitting `/admin/*` get redirected. Admin nav items hidden from student dashboard header.

9. **Onboarding sync** — When onboarding completes, upsert `profiles` table with name, level, goals so admin can see student info.

10. **Lesson slot management enhancements** — Add edit capability to existing AdminAvailabilityPage (currently only add/delete). Add status column display (open/booked/completed).

### Security Boundaries

- All student data tables get additional SELECT policy for `admin_teacher` role
- Students cannot INSERT/UPDATE/DELETE on `user_roles`, `availability_slots`, `teacher_profile`
- Students can only read/write their own rows in all other tables (existing RLS unchanged)
- Role check happens both in UI (route guards, hidden nav) and database (RLS policies)
- The `has_role` function (SECURITY DEFINER) prevents recursive RLS issues

### UI/UX Details

- Empty states with illustrations for no students, no lessons, no errors
- Loading skeletons on all data-fetching components
- Toast notifications for all mutations (add/edit/delete slots, etc.)
- Recharts library for progress charts and module performance breakdown
- Responsive design: sidebar collapses on mobile
- Serbian language for all labels (consistent with existing app)

