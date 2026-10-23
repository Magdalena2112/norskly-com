# Norwegian A2 Lesson 1: the English pictures with Norwegian words

## Goal
The Norwegian lesson uses the same pictures as English A2 Lesson 1. Wherever a picture contains English words (labels, signs, the email, captions on exercise pictures), the Norwegian lesson gets its own copy with those words in Norwegian. The English lesson keeps its original pictures unchanged.

## What will change
1. **Intro texts:** Text 1 and Text 2 show the English pictures, and Text 1 also becomes the lesson cover. Text 3 shows the laptop email picture, with the email rewritten as Anne's Norwegian message.
2. **Vocabulary flashcards:** every Norwegian word gets the picture of its English word (våkne = wake up, and so on). Any English label on a card is replaced with the Norwegian word.
3. **Exercise pictures (Grammar, Vocabulary, Reading, Writing):** I'll go through every picture used in these modules. Pictures that contain English text get a Norwegian copy with the text translated to match the lesson's Norwegian answers. Pictures without text stay shared.
4. **Check:** I'll compare each edited picture with the original to make sure only the words changed and the drawing stays the same. Any picture where the words don't come out clean will be listed for you.

## Technical details
- Find text-bearing images: OCR (pytesseract) on every `a2:*` item image, the `a2t1..t3` intro images and the `a2v1..3` vocab images.
- Edit only those with `imagegen--edit_image`, keeping the original dimensions and a prompt along the lines of "replace only the English text with this Norwegian text, keep everything else identical". Save as `src/assets/lessons/no-a2-l01-*.webp`.
- Register the new images under `no:*` keys in `itemImages.ts` and point `NO-A2-L01.json` at those keys (text-free images keep their `a2:*` keys).
- `images.ts`: add a `NO-A2-L01` entry (T01/T02 = a2t1/a2t2, T03 = the Norwegian email image, cover = a2t1).
- New `NO-A2-L01.vocab-images.json` mapping Norwegian words to images by position, merged into `PICS` in `LessonVocabularyTab.tsx`.
- Verify: build log, then OCR the new images and view the Intro, Vocabulary and exercises in the preview.
