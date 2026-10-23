# Norwegian A2 Lesson 1: same pictures as the English lesson

## What will change
- **Intro texts:** Text 1 (Nora's monologue) and Text 2 (the café chat) show the same pictures as English Texts 1 and 2. They also become the lesson's cover picture.
- **Text 3 (Anne's message):** gets a picture too. The English picture shows an English email on a laptop, so you can pick one of these:
  - use the English picture anyway, or
  - make a matching picture with the email text in Norwegian (same style, same laptop).
  Until you decide, I'll use the English picture.
- **Vocabulary flashcards:** each of the 42 Norwegian words gets the picture of its English word (våkne = wake up, stå opp = get up, and so on). Right now the flashcards look up pictures by English word, so the Norwegian cards have none.
- **Exercises, Reading and Writing** already use the English pictures and stay as they are.

## Technical details
- `src/content/lessons/images.ts`: add a `NO-A2-L01` entry that reuses the `a2t1`/`a2t2`/`a2t3` imports (cover = a2t1).
- New `src/content/lessons/NO-A2-L01.vocab-images.json`: the same areas (a2v1/a2v2/a2v3) with Norwegian word keys. The URLs come from the EN file, matched by word position. Merge it into `PICS` in `LessonVocabularyTab.tsx`.
- Check: build log, and open the lesson's Intro and Vocabulary in the preview to confirm the pictures show.
