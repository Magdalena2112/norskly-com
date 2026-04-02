

## Plan: Optimize Application for Mobile View

### Issues Identified

1. **Dashboard header overflow**: On 390px screens, the header packs logo + Admin button + XP badge + level badge + settings into one row. These elements overflow or get squeezed.

2. **Landing page hero text too large**: `text-5xl` on mobile makes "samopouzdanjem" overflow the viewport width.

3. **Dashboard header badges not responsive**: XP and level badges take too much horizontal space on small screens.

4. **BookLessonPage calendar overflow**: The Calendar component can be wider than the card on small screens.

5. **MyLessonsPage lesson rows**: Date + time + cancel button cramped on mobile.

6. **CTA section padding**: `p-12` on mobile is excessive for the CTA card on LandingPage.

### Changes

**1. `src/pages/LandingPage.tsx`**
- Reduce hero heading from `text-5xl` to `text-3xl` on mobile (keep `md:text-5xl lg:text-7xl`)
- Reduce CTA section padding from `p-12` to `p-6 md:p-12`

**2. `src/pages/DashboardPage.tsx`**
- Wrap header items to stack on mobile: hide XP and level text badges on very small screens (show only on `sm:` and up), keep settings dropdown always visible
- Alternatively, move the XP/level badges below the header on mobile using a second row
- Reduce main heading from `text-3xl` to `text-2xl` on mobile

**3. `src/pages/BookLessonPage.tsx`**
- Add `overflow-hidden` to the calendar card to prevent horizontal overflow
- Ensure the calendar scales properly within its container

**4. `src/pages/MyLessonsPage.tsx`**
- Stack lesson date and cancel button vertically on mobile instead of side-by-side

**5. `src/pages/PracticePage.tsx`**
- Already uses `sm:grid-cols-3` for controls - this is fine
- No major changes needed

### Technical Details

All changes are CSS/Tailwind class adjustments. No logic changes, no database changes. Approximately 5 files modified with responsive class updates (hiding elements on small screens with `hidden sm:flex`, reducing font sizes, adjusting padding).

