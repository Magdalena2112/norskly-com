// Images attached to individual exercise items via `item.image` keys.
import p1 from "@/assets/lessons/en-a1-l01-pr08-1.png.asset.json";
import p2 from "@/assets/lessons/en-a1-l01-pr08-2.png.asset.json";
import p3 from "@/assets/lessons/en-a1-l01-pr08-3.png.asset.json";
import p4 from "@/assets/lessons/en-a1-l01-pr08-4.png.asset.json";

export const ITEM_IMAGES: Record<string, string> = {
  "pr08-1": p1.url,
  "pr08-2": p2.url,
  "pr08-3": p3.url,
  "pr08-4": p4.url,
};

import vocabImgs from "./EN-A1-L01.vocab-images.json";
// Vocabulary picture crops, keyed as "<poster>:<word>" (e.g. "v2:teacher").
for (const [poster, words] of Object.entries(vocabImgs as Record<string, Record<string, string>>)) {
  for (const [w, url] of Object.entries(words)) ITEM_IMAGES[`${poster}:${w}`] = url;
}
