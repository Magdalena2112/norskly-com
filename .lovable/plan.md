# English A2 Lesson 1: intro texts

Add the three intro texts to English A2 Lesson 1, set up the same way as A1 Lesson 1. They appear one at a time, each with its illustration, audio and speakers.

## Content (word for word from the uploads)
1. **Text 1 · A New Routine**: Emma's monologue, 5 paragraphs, one speaker (Emma). Illustration: Emma at her desk.
2. **Text 2 · Catching Up**: dialogue with 12 lines (Oliver, Emma, Sophie). Illustration: the three friends in a café.
3. **Text 3 · Back to Class**: Ms Taylor's email (subject, greeting, schedule, three questions, sign-off), one speaker (Ms Taylor). Illustration: the email on a laptop.

## Illustrations
- Crop each illustration out of the screenshots without the editing handles and store it as a lesson image.
- Text 3's illustration already contains the email, so it is shown in full under the text, in its original proportions.

## Audio
- Pre-record every line with the same voices as A1: Emma, Oliver, Sophie and Ms Taylor sound the same as in Lesson 1.
- Check each recording against its text with a transcription. The browser voice stays as a backup.

## Lesson title
- Until you confirm a title, the lesson stays "Lesson 1". You could use "Lesson 1 · A New Chapter", based on the texts.

## Technical details
- Fill `intro` in `src/content/lessons/EN-A2-L01.json` with ids `EN-A2-L01-T01..T03` (types `monologue` / `dialogue` / `email`, using the same shape as A1).
- Image pointers go in `src/assets/lessons/en-a2-l01-*.webp.asset.json` and are registered in `src/content/lessons/images.ts` under `EN-A2-L01`.
- Audio manifest: `src/content/lessons/EN-A2-L01.audio.json`, using the same `speaker|text` key as A1.
