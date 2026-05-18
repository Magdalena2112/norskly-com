
## Goal

When a student is learning **English**, the AI conversational tutor (`talk-ai`) should adapt its replies, vocabulary, and example situations to that learner's **focus_area** (speaking / writing / grammar / vocabulary / pronunciation) and **life_context** (travel, business English, job interviews, movies & series, everyday, social media, studies abroad) chosen during onboarding and stored in `language_profiles`.

Today the prompt only mentions name, level, and learning_goal — and is hardcoded for Norwegian.

## Changes

### 1. Load `life_context` and `focus_area` per active language
File: `src/context/ProfileContext.tsx`
- Add `life_context` to the `language_profiles` `select(...)` and to the `UserProfile` shape (optional string).
- `focus_area` is already loaded — no change needed.

File: `src/types/profile.ts`
- Add `life_context?: string` to `UserProfile`.

### 2. Send the new fields to talk-ai
File: `src/pages/PracticePage.tsx` (Talk)
- Extend the `profile` payload in both chat and recap fetch calls to include:
  - `focus_area: profile.focus_area`
  - `life_context: profile.life_context`
- Also pass `language: langCode` (already present per current code — verify).

### 3. Make talk-ai language-aware and inject the new context
File: `supabase/functions/talk-ai/index.ts`
- Destructure `language` from the request body (default `"no"`).
- Read `focus_area` and `life_context` from `profile`.
- Build the system prompt with a small language switch:

  **English branch** (language === `"en"`):
  - Persona: "You are an AI English tutor having a natural conversation with {name}, CEFR {level}."
  - Focus-area emphasis line, e.g.:
    - speaking → prioritize natural spoken phrasing, fillers, contractions
    - writing → favor written register, punctuation, paragraph structure
    - grammar → weave one targeted grammar reminder into each correction
    - vocabulary → introduce 1–2 fresh on-topic words per reply
    - pronunciation → flag tricky sounds / stress patterns when relevant
  - Life-context flavoring line, e.g.:
    - travel → airports, hotels, directions, ordering food
    - business English → meetings, email phrasing, polite assertiveness
    - job interviews → STAR answers, professional self-introduction
    - movies and series → idioms, slang, pop-culture references
    - everyday communication → small talk, daily routines
    - social media and internet → casual tone, abbreviations, online etiquette
    - studies abroad → academic vocabulary, campus life, registration
  - Keep the same section format as today, but translate the structural labels:
    `[RESPONSE]`, `[VOCABULARY]`, `[CORRECTIONS]`, `[FEEDBACK]`, `[NEXT STEP]`.
  - Response text must be in English; explanations and feedback remain in Serbian (per project localization policy).

  **Norwegian branch** (language === `"no"`, default):
  - Keep the existing Bokmål prompt, but also append focus_area + life_context lines when present so Norwegian learners benefit too (non-breaking — fields are simply ignored if blank).

- Apply the same focus_area + life_context lines to the `recap` system prompt so the end-of-session summary highlights progress against the learner's chosen real-life context.

### 4. Sanity checks
- Confirm `langCode` is already sent from `PracticePage` and accepted server-side (currently the body sends `language: langCode` but the function never reads it — this plan fixes that).
- No DB migration needed — `life_context` column already exists on `language_profiles`.
- No change to grammar-ai / writing-correct / reading-ai / vocabulary-ai in this pass (they take only `level`); the user asked specifically for the tutoring prompt.

## Out of scope
- Re-localizing UI labels in the Talk page.
- Adding life_context / focus_area to grammar / writing / reading / vocabulary edge functions (can follow as a separate pass if you want).
- Multi-select life_context — onboarding stores a single value today.
