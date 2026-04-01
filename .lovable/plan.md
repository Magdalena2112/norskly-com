

## Saved Explanations Feature — "Sačuvana objašnjenja"

### Overview
Add a database-backed bookmark system for grammar explanations with a sidebar on desktop and collapsible drawer on mobile.

### Changes

**1. Database migration** — new `saved_explanations` table:
```sql
CREATE TABLE public.saved_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  query text NOT NULL,
  explanation_data jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;
-- RLS: users can CRUD own rows
```

**2. `src/pages/GrammarPage.tsx` — ExplainTab changes:**

- Add state for `savedExplanations` list, loaded from DB on mount
- Add a **Bookmark** button (heart/bookmark icon) next to the explanation title card. Toggles save/unsave. Visually changes when saved.
- On save: insert row with `title`, `query`, and full `explanation_data` (the JSON result). On unsave: delete row.
- **Desktop layout**: wrap ExplainTab content in a flex container. Main content on the left (~70%), sidebar on the right (~30%) showing saved list.
- **Mobile layout**: use `useIsMobile()` hook. On mobile, render a collapsible `Collapsible` section above the search card titled "Sačuvana objašnjenja" instead of a sidebar.
- **Sidebar content**: list of saved explanations as simple clickable items with title + small remove (X) icon. Clicking loads the saved `explanation_data` directly into `result` state and sets `query`.
- **Empty state**: "Još nema sačuvanih objašnjenja" message with bookmark icon.

**3. Files affected:**
- 1 migration (new table + RLS)
- `src/pages/GrammarPage.tsx` — ExplainTab UI + save logic (~80 lines added)

### Technical details
- Container width change: the `max-w-2xl` on the grammar page needs to widen to `max-w-5xl` when on the explain tab (to fit sidebar), or the sidebar renders inside the ExplainTab itself with its own flex layout.
- Save check: compare by `query` field to determine if current explanation is already saved.
- No edge function changes needed — data is stored/retrieved via Supabase client directly.

