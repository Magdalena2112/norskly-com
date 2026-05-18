## Pisanje (Writing) Module — Implementation Plan

A new student learning module dedicated to writing practice, image description (bildebeskrivelse), text correction, and writing analytics — visually consistent with the existing Fjord/Scandinavian Norskly design.

### 1. Dashboard card
- Add new module entry on `DashboardPage.tsx`: title "Pisanje", subtitle "Skriving & bildebeskrivelse", description "Vežbaj pisanje, bildebeskrivelse i dobij detaljan feedback.", icon (PenLine), route `/writing`, vignette `book` variant tinted pink, `bg-sunset` medallion, rotation slot.
- Update the existing Grammar card subtitle/description to remove "free text correction" wording (functionality moves to Pisanje).

### 2. Route & page shell
- New route `/writing` in `App.tsx` (protected).
- New page `src/pages/WritingPage.tsx` using `StudentLayout` + `NordicBackdrop`, BackButton, postcard header.
- Tabs (horizontal-scroll on mobile, consistent with Tabs pattern): **Bildebeskrivelse · Korekcija teksta · Istorija**.

### 3. Bildebeskrivelse flow
- Upload image (Supabase Storage bucket `writing-images`, private, per-user folder).
- Image preview + "Analiziraj sliku" CTA → calls new edge function `writing-image-helper` returning:
  - `vocabulary` (word + translation by CEFR level)
  - `expressions`
  - `sentence_starters`
  - `phrases`
- Expandable side panel (desktop split, stacked on mobile) showing helper content.
- Text editor (Textarea) for the user description.
- "Proveri tekst" → calls `writing-correct` edge function returning corrected text + per-error highlights, vocabulary suggestions, naturalness notes, CEFR evaluation, error categories.
- Render corrections with the same highlight style used in Grammar module.

### 4. Korekcija teksta (moved from Grammar)
- Identify and remove the free-text correction tab/section in `GrammarPage.tsx` (uses `grammar_submissions` + `grammar-ai` submission path). Keep grammar quizzes/lessons intact.
- Reuse the same edge function `writing-correct` here without image context.

### 5. PDF export
- "Preuzmi PDF analizu" button on both Bildebeskrivelse and Korekcija results.
- Client-side generation with `jspdf` (lightweight, already common): original text, corrected version, grammar feedback, vocabulary, common mistakes, recommendations, date, Norskly header.

### 6. History
- New table `writing_exercises` (id, user_id, type [`image`|`text`], image_path, original_text, corrected_text, analysis jsonb, vocabulary jsonb, created_at) with RLS (owner + admin_teacher + teachers-with-consent SELECT).
- Save on successful analysis.
- Istorija tab: list with date + type filters and mistake-category filter (from analysis), reopen exercise into editor, regenerate PDF.

### 7. Edge functions (Lovable AI gateway, `google/gemini-3-flash-preview`; image helper uses `google/gemini-2.5-flash` for multimodal)
- `supabase/functions/writing-image-helper/index.ts` — accepts signed image URL + CEFR level, returns structured JSON.
- `supabase/functions/writing-correct/index.ts` — accepts text (+ optional image context), returns corrections, errors, CEFR feedback.
- JWT verification in code, CORS, Zod validation, error logging into `error_events`.

### 8. Storage
- Migration: create `writing-images` bucket (private) + RLS policies (`auth.uid()` in folder path), and the `writing_exercises` table.

### 9. Styling
- Reuse `bg-cream`, `border-border/50`, `shadow-postcard`, `font-display`, `font-script`, burgundy primary. Pink/peach accents via existing `bg-sunset` token.
- Editor card: rounded-3xl cream surface, washi-tape header, soft pastel chips for vocabulary helper.
- Responsive: `lg:grid-cols-2` split for image+editor, stacked below `lg`.

### Technical notes
- Use `react-dropzone` (or native `<input type="file">`) — prefer native to avoid new deps.
- PDF: add `jspdf` dependency.
- All UI copy in Serbian Latin; learning material in Norwegian (Bokmål).
- Memory rules respected (V2 word order, level-aware AI, no hallucinations).
